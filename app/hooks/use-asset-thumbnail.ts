import { useState, useEffect } from 'react';

// Cache for storing asset thumbnails to avoid redundant fetches
const assetCache = new Map<number, string>();

export function useAssetThumbnail(assetId: number | undefined, assetType: string = 'Item') {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no assetId, return placeholder
    if (!assetId) {
      setThumbnail(`https://tr.rbxcdn.com/30DAY-placeholder/150/150/${assetType}/Png/noFilter`);
      return;
    }

    // Check cache first
    if (assetCache.has(assetId)) {
      setThumbnail(assetCache.get(assetId) || null);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);
    
    // Default placeholder during loading
    setThumbnail(`https://tr.rbxcdn.com/30DAY-placeholder/150/150/${assetType}/Png/noFilter`);

    // Fetch the asset thumbnail
    const fetchThumbnail = async () => {
      try {
        const response = await fetch(`/api/roblox/thumbnails?assetIds=${assetId}&size=150x150&format=Png`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch thumbnail: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const assetData = data.data[0];
          if (assetData.state === "Completed" && assetData.imageUrl) {
            // Update state and cache
            setThumbnail(assetData.imageUrl);
            assetCache.set(assetId, assetData.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching asset thumbnail:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch thumbnail');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThumbnail();
  }, [assetId, assetType]);

  return { thumbnail, isLoading, error };
} 