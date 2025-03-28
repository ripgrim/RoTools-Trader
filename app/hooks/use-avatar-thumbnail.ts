import { useState, useEffect } from 'react';

// Cache for storing avatar thumbnails to avoid redundant fetches
export const avatarCache = new Map<number, string>();

// Use a reliable default image that won't cause errors
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%232A2A2A'/%3E%3Cpath d='M75,40 C87,40 97,50 97,62 C97,74 87,84 75,84 C63,84 53,74 53,62 C53,50 63,40 75,40 Z M75,94 C98,94 116,105 116,120 L116,125 L34,125 L34,120 C34,105 52,94 75,94 Z' fill='%23666666'/%3E%3C/svg%3E";

export function useAvatarThumbnail(userId: number | undefined, initialAvatar?: string | null) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar || null);
  const [isLoading, setIsLoading] = useState(!initialAvatar);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useAvatarThumbnail hook called with:", { userId, initialAvatar });
    
    // If no userId, return default avatar
    if (!userId) {
      console.log("No userId provided, using default avatar");
      setAvatar(DEFAULT_AVATAR);
      setIsLoading(false);
      return;
    }

    // If we already have an initialAvatar that's a valid URL, use it
    if (initialAvatar && (initialAvatar.startsWith('http') || initialAvatar.startsWith('data:'))) {
      console.log("Using provided initialAvatar", { initialAvatar });
      setAvatar(initialAvatar);
      setIsLoading(false);
      
      // If it's a Roblox CDN URL and not a placeholder, cache it
      if (initialAvatar.includes('rbxcdn.com') && !initialAvatar.includes('placeholder')) {
        console.log("Caching valid initialAvatar");
        avatarCache.set(userId, initialAvatar);
        return; // No need to fetch again
      }
    }

    // Check cache first
    if (avatarCache.has(userId)) {
      console.log("Using cached avatar");
      setAvatar(avatarCache.get(userId) || null);
      setIsLoading(false);
      return;
    }

    // No valid avatar yet, need to fetch
    setIsLoading(true);
    setError(null);
    
    // Default avatar during loading
    setAvatar(DEFAULT_AVATAR);

    // Fetch the avatar thumbnail
    const fetchAvatar = async () => {
      try {
        console.log(`Fetching avatar for userId: ${userId}`);
        const response = await fetch(`/api/roblox/avatars?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch avatar: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Avatar API response:", data);
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const userData = data.data[0];
          if (userData.state === "Completed" && userData.imageUrl) {
            console.log("Successfully got avatar URL:", userData.imageUrl);
            // Update state and cache
            setAvatar(userData.imageUrl);
            avatarCache.set(userId, userData.imageUrl);
          } else {
            console.warn("Avatar data incomplete:", userData);
            // Keep using the default avatar already set
          }
        } else {
          console.warn("No avatar data returned");
          // Keep using the default avatar already set
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch avatar');
        // Keep using the default avatar already set
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [userId, initialAvatar]); // Don't include avatar in dependencies to prevent infinite loops

  return { avatar, isLoading, error };
} 