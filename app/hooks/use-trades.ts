import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeItem } from '@/app/types/trade';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';

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

export function useTrades() {
  const { isAuthenticated, cookie } = useRobloxAuthContext();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // In the list view, we directly use the user data from the trade
        // The detailed offers will be fetched when the user clicks on a trade
        return {
          id: tradeData.id,
          user: {
            id: tradeData.user.id,
            name: tradeData.user.name,
            displayName: tradeData.user.displayName,
            avatar: `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Webp/noFilter`
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

  // Fetch trades of a specific type
  const fetchTrades = useCallback(async (type: TradeType) => {
    if (!isAuthenticated || !cookie) {
      setIsLoading(false);
      return [];
    }
    
    try {
      console.log(`Fetching ${type} trades...`);
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
      const transformedTrades = transformTradeListData(data.data || [], type);
      
      // Fetch avatars for all users in one batch
      try {
        const userIds = transformedTrades.map(trade => trade.user.id).join(',');
        
        if (userIds.length > 0) {
          console.log(`Fetching avatars for ${transformedTrades.length} users...`);
          const avatarResponse = await fetch(`/api/roblox/avatars?userIds=${userIds}`);
          
          if (avatarResponse.ok) {
            const avatarData = await avatarResponse.json();
            
            if (avatarData?.data && Array.isArray(avatarData.data)) {
              // Create a map of user IDs to avatar URLs
              const avatarMap = new Map();
              avatarData.data.forEach((item: any) => {
                if (item.state === "Completed" && item.imageUrl) {
                  avatarMap.set(item.targetId, item.imageUrl);
                }
              });
              
              // Update the avatar URLs in the trade objects
              transformedTrades.forEach(trade => {
                const avatarUrl = avatarMap.get(trade.user.id);
                if (avatarUrl) {
                  trade.user.avatar = avatarUrl;
                }
              });
            }
          }
        }
      } catch (avatarError) {
        console.error("Error fetching avatars:", avatarError);
        // Continue with default avatars
      }
      
      return transformedTrades;
    } catch (error) {
      console.error(`Error fetching ${type} trades:`, error);
      return [];
    }
  }, [isAuthenticated, cookie, transformTradeListData]);

  // Fetch all trade types and combine them
  const fetchAllTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching all trade types...");
      
      // If not authenticated, return mock data for development
      if (!isAuthenticated || !cookie) {
        console.log("Not authenticated, using mock data");
        setTrades(getMockTrades());
        setIsLoading(false);
        return;
      }
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled([
        fetchTrades('inbound'),
        fetchTrades('outbound'),
        fetchTrades('completed')
      ]);
      
      // Process the results
      const allTrades: Trade[] = [];
      const errors: string[] = [];
      
      results.forEach((result, index) => {
        const tradeType = ['inbound', 'outbound', 'completed'][index] as TradeType;
        
        if (result.status === 'fulfilled') {
          allTrades.push(...result.value);
        } else {
          console.error(`Failed to fetch ${tradeType} trades:`, result.reason);
          errors.push(`${tradeType}: ${result.reason.message || 'Unknown error'}`);
        }
      });
      
      if (errors.length > 0) {
        setError(`Some trade types failed to load: ${errors.join(', ')}`);
      }
      
      // If we didn't get any trades but we're authenticated, use mock data as fallback
      if (allTrades.length === 0) {
        console.log("No trades fetched, using mock data as fallback");
        setTrades(getMockTrades());
      } else {
        setTrades(allTrades);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch trades');
      // Use mock data as fallback on error
      setTrades(getMockTrades());
    } finally {
      setIsLoading(false);
    }
  }, [fetchTrades, isAuthenticated, cookie, getMockTrades]);

  // Fetch trades when authenticated state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllTrades();
    } else {
      setTrades([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchAllTrades]);

  return {
    trades,
    isLoading,
    error,
    refetch: fetchAllTrades
  };
} 