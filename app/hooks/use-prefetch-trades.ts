import { useEffect, useState } from 'react';
import { Trade } from '@/app/types/trade';
import { transformTradeForDetail } from '@/lib/utils';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';
import { useItemDetails } from './use-item-details';

export function usePrefetchTrades(trades: Trade[], count: number = 5) {
  const [prefetchedTradesMap, setPrefetchedTradesMap] = useState<Record<number | string, Trade>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { cookie } = useRobloxAuthContext();
  const { getItemDetails } = useItemDetails();
  
  useEffect(() => {
    if (!trades?.length || !cookie) return;
    
    const prefetchTrades = async () => {
      setIsLoading(true);
      console.log(`Prefetching details for first ${count} trades`);
      
      // Only prefetch the first N trades
      const tradesToPrefetch = trades.slice(0, count);
      const prefetchedMap: Record<number | string, Trade> = {};
      
      for (const trade of tradesToPrefetch) {
        try {
          console.log(`Prefetching trade ${trade.id}`);
          
          // Fetch trade details
          const response = await fetch(`/api/roblox/trades/${trade.id}`, {
            headers: {
              'x-roblox-cookie': cookie,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.warn(`Failed to prefetch trade ${trade.id}: ${response.status}`);
            continue;
          }
          
          const tradeData = await response.json();
          const transformedTrade = transformTradeForDetail(tradeData);
          
          // Fetch values for items in the trade
          const updatedTrade = { ...transformedTrade };
          
          // Process offering items
          for (let i = 0; i < updatedTrade.items.offering.length; i++) {
            const item = updatedTrade.items.offering[i];
            try {
              const details = await getItemDetails(item.id);
              if (details) {
                updatedTrade.items.offering[i] = {
                  ...item,
                  value: details.value,
                  rap: details.rap
                };
              }
            } catch (err) {
              console.error(`Failed to get details for item ${item.id}:`, err);
            }
          }
          
          // Process requesting items
          for (let i = 0; i < updatedTrade.items.requesting.length; i++) {
            const item = updatedTrade.items.requesting[i];
            try {
              const details = await getItemDetails(item.id);
              if (details) {
                updatedTrade.items.requesting[i] = {
                  ...item,
                  value: details.value,
                  rap: details.rap
                };
              }
            } catch (err) {
              console.error(`Failed to get details for item ${item.id}:`, err);
            }
          }
          
          prefetchedMap[trade.id] = updatedTrade;
          console.log(`Successfully prefetched trade ${trade.id} with values`);
          
        } catch (error) {
          console.error(`Error prefetching trade ${trade.id}:`, error);
        }
      }
      
      setPrefetchedTradesMap(prefetchedMap);
      setIsLoading(false);
      console.log(`Prefetched ${Object.keys(prefetchedMap).length} trades`);
    };
    
    prefetchTrades();
  }, [trades, cookie, count, getItemDetails]);
  
  // Function to get a prefetched trade if it exists
  const getPrefetchedTrade = (tradeId: number | string): Trade | null => {
    return prefetchedTradesMap[tradeId] || null;
  };
  
  return {
    prefetchedTradesMap,
    getPrefetchedTrade,
    isLoading
  };
} 