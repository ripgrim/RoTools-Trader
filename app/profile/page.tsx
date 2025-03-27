"use client"

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, Shield } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { RobuxIcon } from "@/components/ui/robux-icon";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch profile data
        const profileResponse = await fetch("/api/profile");
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile");
        }
        const userData = await profileResponse.json();
        setUser(userData);

        // Fetch inventory data
        const inventoryResponse = await fetch("/api/inventory");
        if (!inventoryResponse.ok) {
          throw new Error("Failed to fetch inventory");
        }
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);
      } catch (error) {
        console.error("Data fetch error:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
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
            <div className="p-4 bg-red-500/10 border border-red-500/20">
              <p className="text-red-400">
                {error || "Failed to load profile data"}
              </p>
            </div>
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
              <div className="w-16 h-16 bg-zinc-800 border border-zinc-700">
                <Image
                  src={`https://tr.rbxcdn.com/30DAY-AvatarHeadshot-7181BD1227746006A9A38A4464AA8EF0-Png/150/150/AvatarHeadshot/Webp/noFilter`}
                  alt={user.displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
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