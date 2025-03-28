import { useState, useEffect } from 'react';

// Cache for storing avatar thumbnails to avoid redundant fetches
const avatarCache = new Map<number, string>();

export function useAvatarThumbnail(userId: number | undefined, initialAvatar?: string | null) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar || null);
  const [isLoading, setIsLoading] = useState(!initialAvatar);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no userId, return placeholder
    if (!userId) {
      setAvatar(`https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter`);
      setIsLoading(false);
      return;
    }

    // If we already have an initialAvatar, use it and check if it needs an update
    if (initialAvatar && initialAvatar.includes('rbxcdn.com')) {
      setAvatar(initialAvatar);
      setIsLoading(false);
      
      // If we have a real Roblox CDN URL that's not a placeholder, we can cache it
      if (!initialAvatar.includes('placeholder')) {
        avatarCache.set(userId, initialAvatar);
        return; // No need to fetch again
      }
    }

    // Check cache first
    if (avatarCache.has(userId)) {
      setAvatar(avatarCache.get(userId) || null);
      setIsLoading(false);
      return;
    }

    // No valid avatar yet, need to fetch
    setIsLoading(true);
    setError(null);
    
    // Default placeholder during loading
    if (!avatar) {
      setAvatar(`https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter`);
    }

    // Fetch the avatar thumbnail
    const fetchAvatar = async () => {
      try {
        const response = await fetch(`/api/roblox/avatars?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch avatar: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const userData = data.data[0];
          if (userData.state === "Completed" && userData.imageUrl) {
            // Update state and cache
            setAvatar(userData.imageUrl);
            avatarCache.set(userId, userData.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch avatar');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [userId, initialAvatar, avatar]);

  return { avatar, isLoading, error };
} 