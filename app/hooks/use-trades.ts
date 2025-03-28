import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeItem } from '@/app/types/trade';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';

// Import the shared avatar cache
import { avatarCache } from './use-avatar-thumbnail';

type TradeType = 'inbound' | 'outbound' | 'completed';

interface RobloxAsset {
  assetId: number;
  name: string;
  originalPrice?: number;
  assetType: {
    name: string;
  };
  recentAveragePrice: number;
  serialNumber?: number;
}

interface RobloxTradeItem {
  id: number;
  assetId: number;
  userAssetId: number;
  serialNumber?: number;
  asset: RobloxAsset;
}

interface RobloxTradeListItem {
  id: number;
  user: {
    id: number;
    name: string;
    displayName: string;
  };
  created: string;
  expiration: string;
  isActive: boolean;
  status: string;
}

// For detailed trade data (when viewing a single trade)
interface RobloxTradeData {
  id: number;
  user: {
    id: number;
    name: string;
    displayName: string;
  };
  created: string;
  expiration: string;
  isActive: boolean;
  status: string;
  offers: Array<{
    user: {
      id: number;
      name: string;
      displayName: string;
    };
    userAssets: RobloxTradeItem[];
  }>;
}

// Cache to store trade lists
const tradeListCache = new Map<string, {
  trades: Trade[];
  timestamp: number;
}>();

// Cache expiration time (2 minutes for trade lists)
const CACHE_EXPIRATION = 2 * 60 * 1000;

export function useTrades() {
  const { isAuthenticated, cookie } = useRobloxAuthContext();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [inboundCount, setInboundCount] = useState(0);
  const [isCountLoading, setIsCountLoading] = useState(false);
  // Track displayed trades per type
  const [displayedTrades, setDisplayedTrades] = useState<{
    inbound: Trade[];
    outbound: Trade[];
    completed: Trade[];
  }>({
    inbound: [],
    outbound: [],
    completed: []
  });
  // All fetched trades per type
  const [allFetchedTrades, setAllFetchedTrades] = useState<{
    inbound: Trade[];
    outbound: Trade[];
    completed: Trade[];
  }>({
    inbound: [],
    outbound: [],
    completed: []
  });
  
  // Page size (how many to show at once)
  const pageSize = 10;
  
  // Helper to extract user ID from cookie
  const getUserId = useCallback((cookie: string | null): string => {
    if (!cookie) return '0';
    
    try {
      // In a real implementation, we would extract the actual user ID from the cookie
      // or from a stored user object. For now, using a placeholder.
      
      // You could implement a real extraction like:
      // const decodedData = decodeURIComponent(cookie);
      // const userIdMatch = decodedData.match(/USER_ID=(\d+)/);
      // return userIdMatch ? userIdMatch[1] : '0';
      
      return '0';
    } catch (error) {
      console.error("Error extracting user ID:", error);
      return '0';
    }
  }, []);
  
  // Fallback mock trades for testing/development
  const getMockTrades = useCallback((): Trade[] => {
    return [
      {
        id: 1,
        user: {
          id: 123456,
          name: "MockTrader",
          displayName: "Mock Trader",
          avatar: `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Webp/noFilter`
        },
        status: "Inbound",
        items: {
          offering: [
            {
              id: 1234,
              name: "Mock Limited Item",
              assetType: "Hat",
              thumbnail: `https://tr.rbxcdn.com/180DAY-placeholder/150/150/Hat/Webp/noFilter`,
              rap: 10000,
              value: 10000,
              serial: "123"
            }
          ],
          requesting: [
            {
              id: 5678,
              name: "Your Limited Item",
              assetType: "Hat",
              thumbnail: `https://tr.rbxcdn.com/180DAY-placeholder/150/150/Hat/Webp/noFilter`,
              rap: 12000,
              value: 12000,
              serial: null
            }
          ]
        },
        created: new Date().toISOString(),
        expiration: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        isActive: true
      }
    ];
  }, []);

  // Transform Roblox API data to our application's Trade format
  const transformTradeListData = useCallback((data: RobloxTradeListItem[], tradeType: TradeType): Trade[] => {
    return data.map(tradeData => {
      try {
        // Map trade status
        let status: 'Inbound' | 'Outbound' | 'Completed' | 'Declined' | 'Open';
        switch (tradeType) {
          case 'inbound':
            status = 'Inbound';
            break;
          case 'outbound':
            status = 'Outbound';
            break;
          case 'completed':
            status = tradeData.status === 'Completed' ? 'Completed' : 'Declined';
            break;
          default:
            status = 'Open';
        }
        
        // First check if we have the avatar already cached from the shared avatarCache
        const cachedAvatar = avatarCache.get(tradeData.user.id);
        
        // In the list view, we directly use the user data from the trade
        // The detailed offers will be fetched when the user clicks on a trade
        return {
          id: tradeData.id,
          user: {
            id: tradeData.user.id,
            name: tradeData.user.name,
            displayName: tradeData.user.displayName,
            avatar: cachedAvatar || `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Webp/noFilter`
          },
          status,
          items: {
            offering: [],  // These will be populated when viewing trade details
            requesting: []
          },
          created: tradeData.created,
          expiration: tradeData.expiration,
          isActive: tradeData.isActive
        };
      } catch (error) {
        console.error("Error transforming trade list data:", error, "Trade data:", tradeData);
        // Return a placeholder trade object on error
        return {
          id: tradeData.id || 0,
          user: {
            id: 0,
            name: "Error",
            displayName: "Error Processing Trade",
            avatar: `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Webp/noFilter`
          },
          status: 'Declined' as any,
          items: { offering: [], requesting: [] },
          created: tradeData.created || new Date().toISOString(),
          expiration: tradeData.expiration || new Date().toISOString(),
          isActive: false
        };
      }
    });
  }, []);

  // Fetch avatars for a list of users
  const fetchAvatarsForUsers = useCallback(async (trades: Trade[]) => {
    // Don't fetch if no trades or no users
    if (trades.length === 0) {
      return trades;
    }
    
    try {
      // Get user IDs that aren't already in the shared avatar cache
      const userIdsToFetch = trades
        .filter(trade => !avatarCache.has(trade.user.id))
        .map(trade => trade.user.id);
      
      if (userIdsToFetch.length === 0) {
        console.log("All user avatars already cached, no need to fetch");
        return trades;
      }
      
      console.log(`Fetching avatars for ${userIdsToFetch.length} users...`);
      const response = await fetch(`/api/roblox/avatars?userIds=${userIdsToFetch.join(',')}&size=150x150&format=Png&isCircular=false`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch avatars: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Create a map from the response
        const avatarMap = new Map();
        data.data.forEach((item: any) => {
          if (item.state === "Completed" && item.imageUrl) {
            // Store in both maps
            avatarMap.set(Number(item.targetId), item.imageUrl);
            avatarCache.set(Number(item.targetId), item.imageUrl);
            console.log(`Cached avatar for user ${item.targetId}`);
          }
        });
        
        // Update the trades with avatar URLs
        return trades.map(trade => {
          const avatarUrl = avatarMap.get(trade.user.id);
          if (avatarUrl) {
            return {
              ...trade,
              user: {
                ...trade.user,
                avatar: avatarUrl
              }
            };
          }
          return trade;
        });
      }
    } catch (error) {
      console.error("Error fetching avatars for users:", error);
    }
    
    // Return original trades if anything fails
    return trades;
  }, []);

  // Check for cached trade list
  const getCachedTradeList = useCallback((type: TradeType): Trade[] | null => {
    const cacheKey = type;
    const cachedData = tradeListCache.get(cacheKey);
    
    if (cachedData) {
      const now = Date.now();
      if (now - cachedData.timestamp < CACHE_EXPIRATION) {
        console.log(`Using cached trade list for type: ${type}`);
        return [...cachedData.trades]; // Return a copy to avoid reference issues
      } else {
        console.log(`Cache expired for trade type: ${type}`);
        tradeListCache.delete(cacheKey);
      }
    }
    
    return null;
  }, []);

  // Fetch trades of a specific type
  const fetchTrades = useCallback(async (type: TradeType) => {
    if (!isAuthenticated || !cookie) {
      setIsLoading(false);
      return [];
    }
    
    // Check for cached trade list first
    const cachedTrades = getCachedTradeList(type);
    if (cachedTrades) {
      return cachedTrades;
    }
    
    try {
      console.log(`Fetching ${type} trades...`);
      // Only fetch 25 at a time to keep the API call quick
      const response = await fetch(`/api/roblox/trades/${type}?limit=25`, {
        method: 'GET',
        headers: {
          'x-roblox-cookie': cookie,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch ${type} trades: ${response.status}`, errorText);
        throw new Error(`Failed to fetch ${type} trades: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if data has the expected structure
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error(`Invalid response structure for ${type} trades:`, data);
        return [];
      }
      
      console.log(`Successfully fetched ${type} trades:`, { 
        count: data.data.length, 
        firstUser: data.data[0]?.user?.name || 'No user data' 
      });
      
      // Transform the trade data
      let transformedTrades = transformTradeListData(data.data || [], type);
      
      // Fetch and update avatars
      transformedTrades = await fetchAvatarsForUsers(transformedTrades);
      
      // Cache the trade list
      tradeListCache.set(type, {
        trades: transformedTrades,
        timestamp: Date.now()
      });
      
      return transformedTrades;
    } catch (error) {
      console.error(`Error fetching ${type} trades:`, error);
      return [];
    }
  }, [isAuthenticated, cookie, transformTradeListData, fetchAvatarsForUsers, getCachedTradeList]);

  // Fetch the count of inbound trades
  const fetchInboundCount = useCallback(async () => {
    if (!isAuthenticated || !cookie) {
      return 0;
    }
    
    setIsCountLoading(true);
    
    try {
      console.log('Fetching inbound trades count...');
      const response = await fetch('/api/roblox/trades/inbound/count', {
        method: 'GET',
        headers: {
          'x-roblox-cookie': cookie,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inbound count: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Inbound trades count: ${data.count || 0}`);
      
      setInboundCount(data.count || 0);
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching inbound count:', error);
      return 0;
    } finally {
      setIsCountLoading(false);
    }
  }, [isAuthenticated, cookie]);

  // Fetch all trade types and combine them
  const fetchAllTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch inbound count at the same time
      fetchInboundCount();
      
      const [inboundTrades, outboundTrades, completedTrades] = await Promise.all([
        fetchTrades('inbound'),
        fetchTrades('outbound'),
        fetchTrades('completed')
      ]);
      
      // Store all fetched trades by type
      setAllFetchedTrades({
        inbound: inboundTrades,
        outbound: outboundTrades,
        completed: completedTrades
      });
      
      // For displaying, only show the first pageSize of each type
      setDisplayedTrades({
        inbound: inboundTrades.slice(0, pageSize),
        outbound: outboundTrades.slice(0, pageSize),
        completed: completedTrades.slice(0, pageSize)
      });
      
      // Combine displayed trades for the main trades list
      const combinedTrades = [
        ...inboundTrades.slice(0, pageSize), 
        ...outboundTrades.slice(0, pageSize), 
        ...completedTrades.slice(0, pageSize)
      ];
      
      // If no trades found and authenticated, return mock trades for development
      if (combinedTrades.length === 0 && isAuthenticated) {
        console.log("No real trades found, using mock trades for development");
        const mockTrades = getMockTrades();
        setTrades(mockTrades);
      } else {
        setTrades(combinedTrades);
      }
      
      setError(null);
    } catch (error) {
      console.error("Error fetching all trades:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch trades');
      
      // Fallback to mock data for development
      if (isAuthenticated) {
        console.log("Error occurred, falling back to mock trades");
        setTrades(getMockTrades());
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchTrades, isAuthenticated, getMockTrades, pageSize]);
  
  // Function to load more trades of a specific type
  const loadMoreTrades = useCallback((type: TradeType) => {
    setIsLoadingMore(true);
    
    try {
      // Get current displayed count
      const currentCount = displayedTrades[type].length;
      // Get all already fetched trades of this type
      const allOfType = allFetchedTrades[type];
      
      // Calculate how many more to show
      const newEndIndex = currentCount + pageSize;
      // Get the additional trades to show
      const updatedDisplayed = allOfType.slice(0, newEndIndex);
      
      // Update displayed trades for this type
      setDisplayedTrades(prev => ({
        ...prev,
        [type]: updatedDisplayed
      }));
      
      // Update the combined trades list
      setTrades(prev => {
        // Remove current trades of this type
        const otherTypeTrades = prev.filter(t => {
          if (type === 'inbound') return t.status !== 'Inbound';
          if (type === 'outbound') return t.status !== 'Outbound';
          if (type === 'completed') return t.status !== 'Completed';
          return true;
        });
        
        // Add the updated list of this type
        return [...otherTypeTrades, ...updatedDisplayed];
      });
      
      console.log(`Loaded more ${type} trades, now showing ${updatedDisplayed.length} of ${allOfType.length} total`);
    } catch (error) {
      console.error(`Error loading more ${type} trades:`, error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [displayedTrades, allFetchedTrades, pageSize]);
  
  // Check if there are more trades to load for a specific type
  const hasMoreTrades = useCallback((type: TradeType): boolean => {
    return displayedTrades[type].length < allFetchedTrades[type].length;
  }, [displayedTrades, allFetchedTrades]);
  
  // Fetch trades when authenticated state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllTrades();
    } else {
      setTrades([]);
      setDisplayedTrades({ inbound: [], outbound: [], completed: [] });
      setAllFetchedTrades({ inbound: [], outbound: [], completed: [] });
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchAllTrades]);
  
  // Remove a specific trade from the displayed trades and cached trades
  const removeTrade = useCallback((tradeId: string | number) => {
    const id = String(tradeId);
    console.log(`Removing trade ID: ${id} from displayed trades and cache`);
    
    // Update displayed trades
    setDisplayedTrades(current => ({
      inbound: current.inbound.filter(trade => String(trade.id) !== id),
      outbound: current.outbound.filter(trade => String(trade.id) !== id),
      completed: current.completed.filter(trade => String(trade.id) !== id)
    }));
    
    // Update all fetched trades
    setAllFetchedTrades(current => ({
      inbound: current.inbound.filter(trade => String(trade.id) !== id),
      outbound: current.outbound.filter(trade => String(trade.id) !== id),
      completed: current.completed.filter(trade => String(trade.id) !== id)
    }));
    
    // Also remove from the shared cache
    tradeListCache.forEach((value, key) => {
      const updatedTrades = value.trades.filter(trade => String(trade.id) !== id);
      if (updatedTrades.length !== value.trades.length) {
        console.log(`Removed trade ID: ${id} from cache type: ${key}`);
        tradeListCache.set(key, {
          trades: updatedTrades,
          timestamp: value.timestamp
        });
      }
    });
  }, []);

  return {
    trades,
    isLoading,
    error,
    isLoadingMore,
    displayedTrades,
    loadMoreTrades,
    hasMoreTrades,
    inboundCount,
    isCountLoading,
    refreshInboundCount: fetchInboundCount,
    refetch: fetchAllTrades,
    removeTrade,
    clearCache: () => {
      tradeListCache.clear();
      console.log("Cleared all trade list caches");
    }
  };
} 