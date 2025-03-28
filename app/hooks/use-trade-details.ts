import { useState, useEffect, useCallback, useRef } from 'react';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';
import { Trade, TradeItem } from '@/app/types/trade';
import { transformTradeForDetail } from '@/lib/utils';

// Cache to store fetched trade details
const tradeCache = new Map<string, {
  trade: Trade;
  timestamp: number;
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export function useTradeDetails(tradeId: string | number | null) {
  const { isAuthenticated, cookie } = useRobloxAuthContext();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Function to create a clean deep copy of a trade to prevent reference issues
  const cleanTrade = useCallback((trade: Trade): Trade => {
    try {
      return JSON.parse(JSON.stringify(trade));
    } catch (error) {
      console.error("Error creating clean trade copy:", error);
      return trade; // Return original as fallback
    }
  }, []);

  // Check if there's a cached trade and it's not expired
  const getCachedTrade = useCallback((id: string | number): Trade | null => {
    const cacheKey = id.toString();
    const cachedData = tradeCache.get(cacheKey);
    
    if (cachedData) {
      const now = Date.now();
      if (now - cachedData.timestamp < CACHE_EXPIRATION) {
        console.log(`Using cached trade data for ID: ${id}`);
        // Return a clean copy of the cached trade to avoid reference issues
        return cleanTrade(cachedData.trade);
      } else {
        // Remove expired cache entry
        console.log(`Cache expired for trade ID: ${id}`);
        tradeCache.delete(cacheKey);
      }
    }
    
    return null;
  }, [cleanTrade]);

  // Function to update item thumbnails with real ones
  const updateThumbnails = useCallback(async (currentTrade: Trade) => {
    // This function will update thumbnails for both offering and requesting items
    try {
      // Create a deep copy of the trade to avoid mutation issues
      const updatedTrade = JSON.parse(JSON.stringify(currentTrade)) as Trade;
      
      // Collect all asset IDs that need thumbnails
      const assetIds: number[] = [
        ...updatedTrade.items.offering.map(item => item.id),
        ...updatedTrade.items.requesting.map(item => item.id)
      ];
      
      if (assetIds.length === 0) {
        return updatedTrade;
      }
      
      // Fetch asset thumbnails
      console.log("Fetching asset thumbnails for trade items...");
      const assetResponse = await fetch(`/api/roblox/thumbnails?assetIds=${assetIds.join(',')}&size=150x150&format=Png`);
      
      if (!assetResponse.ok) {
        console.error("Failed to fetch asset thumbnails");
      } else {
        const assetData = await assetResponse.json();
        
        // Create a map of asset IDs to image URLs
        const thumbnailMap = new Map<number, string>();
        
        if (assetData.data && Array.isArray(assetData.data)) {
          assetData.data.forEach((item: any) => {
            if (item.state === "Completed" && item.imageUrl) {
              thumbnailMap.set(Number(item.targetId), item.imageUrl);
            }
          });
        }
        
        // Update asset thumbnails
        const updateItems = (items: TradeItem[]) => {
          items.forEach(item => {
            const thumbnailUrl = thumbnailMap.get(item.id);
            if (thumbnailUrl) {
              item.thumbnail = thumbnailUrl;
            }
          });
        };
        
        updateItems(updatedTrade.items.offering);
        updateItems(updatedTrade.items.requesting);
      }
      
      // Fetch user avatar thumbnail
      if (updatedTrade.user && updatedTrade.user.id) {
        console.log("Fetching user avatar thumbnail...");
        const avatarResponse = await fetch(`/api/roblox/avatars?userIds=${updatedTrade.user.id}&size=150x150&format=Png&isCircular=false`);
        
        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          
          if (avatarData.data && Array.isArray(avatarData.data) && avatarData.data.length > 0) {
            const userData = avatarData.data[0];
            if (userData.state === "Completed" && userData.imageUrl) {
              console.log(`Updated user avatar thumbnail with URL: ${userData.imageUrl.substring(0, 50)}...`);
              updatedTrade.user.avatar = userData.imageUrl;
            }
          }
        } else {
          console.error("Failed to fetch user avatar thumbnail");
        }
      }
      
      // Set the updated trade in state
      if (isMounted.current) {
        setTrade(updatedTrade);
      }
      
      return updatedTrade;
    } catch (err) {
      console.error("Error updating thumbnails:", err);
      // Don't update state on error, keep the current trade
      return currentTrade;
    }
  }, []);

  const fetchTradeDetails = useCallback(async () => {
    if (!isAuthenticated || !cookie || !tradeId) {
      setIsLoading(false);
      setError('Authentication or trade ID required');
      return;
    }

    // Always reset loading state when fetching starts
    setIsLoading(true);
    setError(null);

    // Check if we have a cached version
    const cachedTrade = getCachedTrade(tradeId);
    if (cachedTrade) {
      if (isMounted.current) {
        // Ensure we're not just adding to existing state but replacing it entirely
        setTrade(cachedTrade);
        setIsLoading(false);
      }
      return;
    }

    try {
      console.log(`Fetching details for trade ID: ${tradeId}`);
      const response = await fetch(`/api/roblox/trades/${tradeId}`, {
        method: 'GET',
        headers: {
          'x-roblox-cookie': cookie,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch trade details: ${response.status}`, errorData);
        throw new Error(errorData.error || `Failed to fetch trade details: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched trade details:`, data);
      
      // Transform the API response into our app's Trade type
      const transformedTrade = transformTradeForDetail(data);
      
      if (isMounted.current) {
        // Use a clean copy to prevent reference issues
        setTrade(cleanTrade(transformedTrade));
      }
      
      // Update with real thumbnails
      const updatedTrade = await updateThumbnails(transformedTrade);
      
      // Store in cache
      tradeCache.set(tradeId.toString(), {
        trade: updatedTrade,
        timestamp: Date.now()
      });
      
      console.log(`Cached trade data for ID: ${tradeId}`);
    } catch (error) {
      console.error('Error fetching trade details:', error);
      if (isMounted.current) {
        setError(error instanceof Error ? error.message : 'Failed to fetch trade details');
        setTrade(null);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, cookie, tradeId, updateThumbnails, getCachedTrade, cleanTrade]);

  // Clear the mounted flag on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch trade details when component mounts or parameters change
  useEffect(() => {
    // Reset state when tradeId changes
    if (tradeId !== null) {
      // Clear state before fetching new trade data
      setTrade(null);
      setError(null);
      setIsLoading(true);
    }
    
    fetchTradeDetails();
  }, [fetchTradeDetails, tradeId]);

  return {
    trade,
    isLoading,
    error,
    refetch: fetchTradeDetails,
    clearCache: () => {
      if (tradeId) {
        tradeCache.delete(tradeId.toString());
        console.log(`Cleared cache for trade ID: ${tradeId}`);
      }
    }
  };
} 