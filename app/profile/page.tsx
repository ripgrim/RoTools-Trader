"use client"

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, Shield, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { RobuxIcon } from "@/components/ui/robux-icon";
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';
import { useAvatarThumbnail } from '@/app/hooks/use-avatar-thumbnail';

interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: string | null;
}

interface InventoryItem {
  assetId: number;
  name: string;
  serial: number | null;
  rap: number;
  value: number;
  demand: number;
  trend: number;
  projected: boolean;
  hyped: boolean;
  rare: boolean;
  limited: number;
  acronym: string;
  thumbnailUrl?: string;
}

interface ThumbnailResponse {
  data: {
    targetId: number;
    state: string;
    imageUrl: string;
    version: string;
  }[];
}

const DEMAND_LABELS = {
  "-1": "Unassigned",
  "0": "Terrible",
  "1": "Low",
  "2": "Normal",
  "3": "High",
  "4": "Amazing"
} as const;

const TREND_LABELS = {
  "-1": "Unassigned",
  "0": "Lowering",
  "1": "Unstable",
  "2": "Stable",
  "3": "Raising",
  "4": "Fluctuating"
} as const;

const DEMAND_COLORS = {
  "-1": "text-zinc-500 italic",
  "0": "text-red-400",
  "1": "text-orange-400",
  "2": "text-yellow-400",
  "3": "text-green-400",
  "4": "text-blue-400"
} as const;

const TREND_COLORS = {
  "-1": "text-zinc-500 italic",
  "0": "text-red-400",
  "1": "text-orange-400",
  "2": "text-yellow-400",
  "3": "text-green-400",
  "4": "text-purple-400"
} as const;

export default function ProfilePage() {
  const [user, setUser] = useState<RobloxUser | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, cookie, refreshCookie, logout } = useRobloxAuthContext();
  
  // Use the avatar thumbnail hook for the profile image
  const { avatar, isLoading: isAvatarLoading } = useAvatarThumbnail(
    user?.id, 
    null // We'll let the hook fetch the avatar
  );

  // Try to refresh the cookie when authentication fails
  const handleAuthFailure = useCallback(async () => {
    if (!cookie) return false;
    
    try {
      console.log("Attempting to refresh Roblox cookie...");
      const freshCookie = await refreshCookie(cookie);
      
      if (freshCookie) {
        console.log("Cookie refreshed successfully");
        return true;
      } else {
        console.log("Cookie refresh failed, logging out");
        await logout();
        setError("Your session has expired. Please log in again.");
        return false;
      }
    } catch (err) {
      console.error("Error refreshing cookie:", err);
      await logout();
      setError("Authentication error. Please log in again.");
      return false;
    }
  }, [cookie, refreshCookie, logout]);

  // Direct client-side fetch from Roblox API (bypass our server)
  const fetchDirectFromRoblox = useCallback(async (endpoint: string, cookieValue: string) => {
    console.log(`Direct fetch from Roblox: ${endpoint}`);
    
    // Sanitize cookie
    const sanitizedCookie = cookieValue.includes('.ROBLOSECURITY=') 
      ? cookieValue.split('.ROBLOSECURITY=')[1].split(';')[0] 
      : cookieValue;
    
    try {
      const response = await fetch(`https://${endpoint}`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${sanitizedCookie}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log(`Direct Roblox API response (${endpoint}):`, response.status);
      
      if (!response.ok) {
        throw new Error(`Roblox API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Direct Roblox API error (${endpoint}):`, error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if not authenticated
      if (!isAuthenticated || !cookie) {
        setError("Please log in to view your profile");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("Auth state:", { isAuthenticated, cookieExists: !!cookie, cookieLength: cookie?.length });
        
        // Ensure cookie is properly formatted
        const sanitizedCookie = cookie.includes('.ROBLOSECURITY=') 
          ? cookie.split('.ROBLOSECURITY=')[1].split(';')[0] 
          : cookie;
        
        console.log("Sanitized cookie length:", sanitizedCookie.length);

        // Try direct fetch from Roblox API (client-side)
        try {
          console.log("Trying direct client-side fetch to Roblox API");
          const userData = await fetchDirectFromRoblox('users.roblox.com/v1/users/authenticated', cookie);
          console.log("User data fetched directly from Roblox:", userData);
          setUser(userData);
          
          // If we have a user ID, try to fetch inventory using our server endpoint
          // (Our server endpoint can still work with a valid user ID)
          if (userData?.id) {
            try {
              console.log("Fetching inventory from server with valid user ID");
              const inventoryResponse = await fetch("/api/inventory", {
                headers: {
                  'x-roblox-cookie': sanitizedCookie
                }
              });
              
              if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json();
                console.log(`Inventory data fetched: ${inventoryData.length} items`);
                setInventory(inventoryData);
              } else {
                console.error("Inventory fetch failed, will use empty inventory");
                setInventory([]);
              }
            } catch (err) {
              console.error("Error fetching inventory:", err);
              setInventory([]);
            }
          }
        } catch (directError) {
          console.error("Direct Roblox API fetch failed:", directError);
          console.log("Falling back to server endpoints");
          
          // Fallback to server endpoints
          try {
            // Fetch profile data through our server endpoint
            const profileResponse = await fetch("/api/profile", {
              headers: {
                'x-roblox-cookie': sanitizedCookie
              }
            });
            
            console.log("Profile response status:", profileResponse.status);
            
            // Try refreshing token if we get a 403
            if (profileResponse.status === 403) {
              await handleAuthFailure();
              throw new Error("Unable to authenticate with Roblox");
            }
            
            if (!profileResponse.ok) {
              const errorData = await profileResponse.json().catch(() => ({}));
              throw new Error(`Failed to fetch profile: ${profileResponse.status} ${errorData.error || ''}`);
            }
            
            const userData = await profileResponse.json();
            setUser(userData);
            
            // Fetch inventory
            const inventoryResponse = await fetch("/api/inventory", {
              headers: {
                'x-roblox-cookie': sanitizedCookie
              }
            });
            
            if (!inventoryResponse.ok) {
              throw new Error("Failed to fetch inventory");
            }
            
            const inventoryData = await inventoryResponse.json();
            setInventory(inventoryData);
          } catch (serverError) {
            console.error("Server endpoint fallback failed:", serverError);
            throw new Error("Failed to fetch data: Please verify your Roblox cookie is valid");
          }
        }
      } catch (error) {
        console.error("Data fetch error:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, cookie, handleAuthFailure, fetchDirectFromRoblox]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {isAuthenticated ? (
              <>
                <div className="space-y-4">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 bg-zinc-900/50 border border-zinc-800 text-center">
                <Shield className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">Checking Authentication...</h2>
                <div className="flex justify-center my-4">
                  <div className="w-6 h-6 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin"></div>
                </div>
                <p className="text-zinc-400">Please wait while we verify your login status.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {!isAuthenticated ? (
              <div className="p-8 bg-zinc-900/50 border border-zinc-800 text-center">
                <Shield className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">Authentication Required</h2>
                <p className="text-zinc-400 mb-6">Please log in to view your profile and inventory.</p>
                <button 
                  className="px-4 py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                  onClick={() => window.location.href = "/"}
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/20">
                <p className="text-red-400">
                  {error || "Failed to load profile data"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Calculate total inventory value and RAP
  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);
  const totalRap = inventory.reduce((sum, item) => sum + item.rap, 0);

  // Format numbers with commas
  const formattedValue = totalValue.toLocaleString();
  const formattedRap = totalRap.toLocaleString();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* User Info Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 relative">
                {isAvatarLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                  </div>
                ) : (
                  <Image
                    src={avatar || `/api/fallback-avatar?userId=${user.id}`}
                    alt={user.displayName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Avatar image failed to load:", e);
                      // Fallback to a default SVG avatar
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%232A2A2A'/%3E%3Cpath d='M75,40 C87,40 97,50 97,62 C97,74 87,84 75,84 C63,84 53,74 53,62 C53,50 63,40 75,40 Z M75,94 C98,94 116,105 116,120 L116,125 L34,125 L34,120 C34,105 52,94 75,94 Z' fill='%23666666'/%3E%3C/svg%3E";
                    }}
                  />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-100">{user.displayName}</h1>
                <p className="text-sm text-zinc-400">@{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-zinc-500">
                Joined {new Date(user.created).toLocaleDateString()}
              </div>
              {user.isBanned && (
                <div className="text-red-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-none bg-red-400 animate-pulse" />
                  Banned
                </div>
              )}
            </div>
          </div>
          {user.description && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-sm text-zinc-400">{user.description}</p>
            </div>
          )}
        </motion.div>

        <div className="mb-6 text-center">
          <p className="text-xs text-zinc-500">
            Your profile data and inventory are now fetched using your authenticated account
          </p>
        </div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 p-6 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Inventory Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Value */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/50 border border-zinc-800 p-4"
            >
              <div className="flex flex-col">
                <span className="text-zinc-400 text-sm">Total Value</span>
                <span className="text-white font-semibold text-2xl flex items-center gap-1">
                    <Image src="/icons/rolimons_logo_icon_blue.png" alt="Rolimons" width={16} height={16} className="object-contain"/> {formattedValue}</span>
              </div>
            </motion.div>

            {/* Total RAP */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900/50 border border-zinc-800 p-4"
            >
              <div className="flex flex-col">
                <span className="text-zinc-400 text-sm">Total RAP</span>
                <span className="text-white font-semibold text-2xl flex items-center gap-1"><RobuxIcon className="w-4 h-4 text-white"/> {formattedRap}</span>
              </div>
            </motion.div>

            {/* Item Count */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-900/50 border border-zinc-800 p-4"
            >
              <div className="flex flex-col">
                <span className="text-zinc-400 text-sm">Total Items</span>
                <span className="text-white font-semibold text-2xl">{inventory.length}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Inventory Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {inventory.map((item, index) => (
            <motion.div
              key={item.assetId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 p-4 hover:bg-zinc-800/50 transition-colors"
            >
              {/* Item Image */}
              <div className="relative aspect-square mb-4 bg-zinc-900/50 border border-zinc-800">
                <Image
                  src={item.thumbnailUrl || `https://tr.rbxcdn.com/${item.assetId}/420/420/Image/Png`}
                  alt={item.name}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Item Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-100 text-sm">{item.name}</h3>
                    <p className="text-xs text-zinc-400">{item.acronym}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {item.rare && (
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs">
                        Rare
                      </Badge>
                    )}
                    {item.projected && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs">
                        Projected
                      </Badge>
                    )}
                    {item.hyped && (
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs">
                        Hyped
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs space-y-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">RAP:</span>
                      <span className="text-white flex items-center gap-1"><RobuxIcon className="w-4 h-4 text-white"/> {item.rap.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Value:</span>
                      <span className="text-white flex items-center gap-1">
                        {item.value === -1 ? (
                          <span className="text-zinc-500 italic">Unassigned</span>
                        ) : (
                          <>
                            <Image src="/icons/rolimons_logo_icon_blue.png" alt="Rolimons" width={10} height={10} className="object-contain"/>
                            {item.value.toLocaleString()}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Demand:</span>
                      <span className={`${DEMAND_COLORS[item.demand.toString() as keyof typeof DEMAND_COLORS]}`}>
                        {item.demand === -1 ? (
                          <span className="italic">Unassigned</span>
                        ) : (
                          DEMAND_LABELS[item.demand.toString() as keyof typeof DEMAND_LABELS]
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Trend:</span>
                      <span className={`${TREND_COLORS[item.trend.toString() as keyof typeof TREND_COLORS]}`}>
                        {item.trend === -1 ? (
                          <span className="italic">Unassigned</span>
                        ) : (
                          TREND_LABELS[item.trend.toString() as keyof typeof TREND_LABELS]
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
} 