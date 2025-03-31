import { useState, useEffect, useCallback } from 'react';

// Interface for item details based on Rolimons data
interface ItemDetail {
  name: string;
  acronym: string;
  rap: number;
  value: number;
  defaultValue: number;
  demand: number;
  trend: number;
  projected: number;
  hyped: number;
  rare: number;
}

// Type definitions for the text representations of numeric values
type DemandText = 'None' | 'Terrible' | 'Low' | 'Normal' | 'High' | 'Amazing';
type TrendText = 'None' | 'Lowering' | 'Unstable' | 'Stable' | 'Raising' | 'Fluctuating';

// Cache for item data to avoid repeated API calls
const itemsCache: Record<string, ItemDetail> = {};
let allItemsData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 0; // Set to 0 to disable caching temporarily

export function useItemDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all items from the API
  const fetchAllItems = useCallback(async (force = true) => {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (allItemsData && !force && (now - lastFetchTime) < CACHE_DURATION) {
      console.log("Using cached items data");
      return allItemsData;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching all items from API");
      const response = await fetch('/api/items');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch items data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${Object.keys(data.items || {}).length} items`);
      
      // Save to cache
      allItemsData = data;
      lastFetchTime = now;
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error fetching items';
      console.error("Error fetching items:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get details for a specific item
  const getItemDetails = useCallback(async (itemId: string | number): Promise<ItemDetail | null> => {
    const id = itemId.toString();
    
    // Clear cache for this specific item
    if (itemsCache[id]) {
      console.log(`[DEBUG] Clearing cache for item ${id}`, itemsCache[id]);
      delete itemsCache[id];
    }
    
    // Add debug timestamp to prevent any caching issues
    const timestamp = Date.now(); 
    console.log(`[DEBUG] Fetching fresh data for item ${id} at ${timestamp}`);
    
    // Fetch all items for each request
    const data = await fetchAllItems(true);
    if (!data || !data.items || !data.items[id]) {
      console.log(`Item ${id} not found in Rolimons data`);
      return null;
    }
    
    // Parse the item data
    const item = data.items[id];
    const itemDetail: ItemDetail = {
      name: item[0],
      acronym: item[1],
      rap: item[2],
      value: item[3],
      defaultValue: item[4],
      demand: item[5],
      trend: item[6],
      projected: item[7],
      hyped: item[8],
      rare: item[9]
    };
    
    // Add debug logging for the parsed item
    console.log(`[DEBUG] Item ${id} details:`, {
      name: itemDetail.name,
      value: itemDetail.value,
      rap: itemDetail.rap,
      timestamp: timestamp
    });
    
    // Don't cache the item data for now
    // itemsCache[id] = itemDetail;
    
    return itemDetail;
  }, [fetchAllItems]);

  // Helper function to get effective value (value if valid, otherwise RAP)
  const getEffectiveValue = useCallback((item: ItemDetail): number => {
    // If value is valid (not -1), use it, otherwise use RAP
    return item.value && item.value !== -1 ? item.value : item.rap;
  }, []);

  // Helper function to get demand text
  const getDemandText = useCallback((demandValue: number): DemandText => {
    const demands: Record<string, DemandText> = {
      '-1': 'None',
      '0': 'Terrible',
      '1': 'Low',
      '2': 'Normal',
      '3': 'High',
      '4': 'Amazing'
    };
    return demands[demandValue.toString()] || 'None';
  }, []);

  // Helper function to get trend text
  const getTrendText = useCallback((trendValue: number): TrendText => {
    const trends: Record<string, TrendText> = {
      '-1': 'None',
      '0': 'Lowering',
      '1': 'Unstable',
      '2': 'Stable',
      '3': 'Raising',
      '4': 'Fluctuating'
    };
    return trends[trendValue.toString()] || 'None';
  }, []);

  // Helper function to check if item is projected
  const isProjected = useCallback((value: number): boolean => {
    return value === 1;
  }, []);

  // Helper function to check if item is hyped
  const isHyped = useCallback((value: number): boolean => {
    return value === 1;
  }, []);

  // Helper function to check if item is rare
  const isRare = useCallback((value: number): boolean => {
    return value === 1;
  }, []);

  return {
    getItemDetails,
    getEffectiveValue,
    getDemandText,
    getTrendText,
    isProjected,
    isHyped,
    isRare,
    fetchAllItems,
    isLoading,
    error
  };
} 