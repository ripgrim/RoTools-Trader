"use client"

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, Shield } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { RobuxIcon } from "@/components/ui/robux-icon";
import { getProfile } from "@/api/user";
import { useToken } from "@/providers/token-provider";
import { getRolimonsInventory } from "@/api/items";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useParams } from "next/navigation";

interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: string | null;
  avatarUrl: string,
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
  count?: number | null;
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
  "-1": "text-foreground italic",
  "0": "text-red-400",
  "1": "text-orange-400",
  "2": "text-yellow-400",
  "3": "text-green-400",
  "4": "text-blue-400"
} as const;

const TREND_COLORS = {
  "-1": "text-foreground italic",
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
  const [sortBy, setSortBy] = useState<string>("value");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const {token} = useToken()
  const {id} = useParams()

  useEffect(() => {
    setUser(null)
    setError(null)
    setIsLoading(true)
    if (token) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);
  
          // Fetch profile data
          const profileResponse = await getProfile(token, (id as string) === "me" ? undefined : String(id));
          setUser(profileResponse);
  
          const inventoryData = await getRolimonsInventory(String(profileResponse.id))
          setInventory(inventoryData);
        } catch (error) {
          console.error("Data fetch error:", error);
          setError(error instanceof Error ? error.message : "Failed to load data");
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchData();
    }
  }, [token, id]);

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
  const totalValue = inventory.reduce((sum, item) => {
    const count = item.count && item.count > 1 ? item.count : 1;
    return sum + (item.value * count);
  }, 0);
  
  const totalRap = inventory.reduce((sum, item) => {
    const count = item.count && item.count > 1 ? item.count : 1;
    return sum + (item.rap * count);
  }, 0);

  // Format numbers with commas
  const formattedValue = totalValue.toLocaleString();
  const formattedRap = totalRap.toLocaleString();

  const sortedInventory = [...inventory].sort((a, b) => {
    let compareA: any;
    let compareB: any;

    switch (sortBy) {
      case "rap":
        compareA = a.rap;
        compareB = b.rap;
        break;
      case "demand":
        compareA = a.demand;
        compareB = b.demand;
        break;
      case "quantity":
        compareA = a.count ?? 1;
        compareB = b.count ?? 1;
        break;
      case "value":
      default:
        compareA = a.value;
        compareB = b.value;
        break;
    }
    
    // Handle unassigned values (-1 for value/demand) - place them last when descending, first when ascending
    if (compareA === -1 && compareB !== -1) return sortDirection === 'desc' ? 1 : -1;
    if (compareB === -1 && compareA !== -1) return sortDirection === 'desc' ? -1 : 1;
    if (compareA === -1 && compareB === -1) return 0; // Keep original order if both are unassigned

    // Primary sort comparison
    const primaryDiff = sortDirection === "desc" ? compareB - compareA : compareA - compareB;

    // If primary sort results in a difference, return it
    if (primaryDiff !== 0) {
      return primaryDiff;
    }

    // Secondary sort: If primary is equal and sorting by quantity, sort by value
    if (sortBy === "quantity") {
        // Handle unassigned values for secondary sort
       const valA = a.value === -1 ? (sortDirection === 'desc' ? -Infinity : Infinity) : a.value;
       const valB = b.value === -1 ? (sortDirection === 'desc' ? -Infinity : Infinity) : b.value;
       return sortDirection === "desc" ? valB - valA : valA - valB;
    }
    
    // If primary is equal and not sorting by quantity, maintain original relative order (stable sort not guaranteed by default .sort, but good enough here)
    return 0; 
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* User Info Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background/50 border border-border p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-background border border-border">
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{user.displayName}</h1>
                <p className="text-sm text-foreground">@{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-foreground">
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
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-foreground">{user.description}</p>
            </div>
          )}
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-background/50 border border-border p-6 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Inventory Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Value */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-background/50 border border-border p-4"
            >
              <div className="flex flex-col">
                <span className="text-foreground text-sm">Total Value</span>
                <span className="text-foreground font-semibold text-2xl flex items-center gap-1">
                    <img src="/icons/rolimons_logo_icon_blue.png" alt="Rolimons" width={16} height={16} className="object-contain"/> {formattedValue}</span>
              </div>
            </motion.div>

            {/* Total RAP */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-background/50 border border-border p-4"
            >
              <div className="flex flex-col">
                <span className="text-foreground text-sm">Total RAP</span>
                <span className="text-foreground font-semibold text-2xl flex items-center gap-1"><RobuxIcon className="w-4 h-4 text-foreground"/> {formattedRap}</span>
              </div>
            </motion.div>

            {/* Item Count */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-background/50 border border-border p-4"
            >
              <div className="flex flex-col">
                <span className="text-foreground text-sm">Total Items</span>
                <span className="text-foreground font-semibold text-2xl">{inventory.length}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mb-6 flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="grid w-full sm:w-auto sm:max-w-xs items-center gap-1.5">
            <Label htmlFor="sort-by" className="text-xs text-foreground">Sort by</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by" className="bg-background/50 border-border rounded-none focus:ring w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground rounded-none">
                <SelectItem value="value" className="focus:bg-background rounded-none">Value</SelectItem>
                <SelectItem value="rap" className="focus:bg-background rounded-none">RAP</SelectItem>
                <SelectItem value="demand" className="focus:bg-background rounded-none">Demand</SelectItem>
                <SelectItem value="quantity" className="focus:bg-background rounded-none">Quantity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full sm:w-auto sm:max-w-xs items-center gap-1.5">
             <Label htmlFor="sort-direction" className="text-xs text-foreground">Order</Label>
            <Select value={sortDirection} onValueChange={setSortDirection}>
              <SelectTrigger id="sort-direction" className="bg-background/50 border-border rounded-none focus:ring w-full sm:w-[180px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground rounded-none">
                <SelectItem value="desc" className="focus:bg-background rounded-none">High to Low</SelectItem>
                <SelectItem value="asc" className="focus:bg-background rounded-none">Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Inventory Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {sortedInventory.map((item, index) => (
            <motion.div
              key={item.assetId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="relative"
            >
              {/* Main item card */}
              <div className="bg-background/50 border border-border p-4 hover:bg-background/50 transition-colors relative z-20">
                {/* Item Image */}
                <div className="relative aspect-square mb-4 bg-background/50 border border-border">
                  <img
                    src={item.thumbnailUrl || `https://tr.rbxcdn.com/${item.assetId}/420/420/Image/Png`}
                    alt={item.name}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {item.count && item.count > 1 && (
                    <div className="absolute top-2 right-2 bg-background/90 text-foreground text-xs font-medium px-2 py-1 rounded-none">
                      x{item.count}
                    </div>
                  )}
                </div>

                {/* Item Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{item.name}</h3>
                      <p className="text-xs text-foreground">{item.acronym}</p>
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
                        <span className="text-foreground">
                          {item.count && item.count > 1 ? "Total RAP:" : "RAP:"}
                        </span>
                        <span className="text-foreground flex items-center gap-1">
                          <RobuxIcon className="w-4 h-4 text-foreground"/> 
                          {item.count && item.count > 1 
                            ? (item.rap * item.count).toLocaleString()
                            : item.rap.toLocaleString()
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-foreground">
                          {item.count && item.count > 1 ? "Total Value:" : "Value:"}
                        </span>
                        <span className="text-foreground flex items-center gap-1">
                          {item.value === -1 ? (
                            <span className="text-foreground italic">Unassigned</span>
                          ) : (
                            <>
                              <img src="/icons/rolimons_logo_icon_blue.png" alt="Rolimons" width={10} height={10} className="object-contain"/>
                              {item.count && item.count > 1 
                                ? (item.value * item.count).toLocaleString()
                                : item.value.toLocaleString()
                              }
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-foreground">Demand:</span>
                        <span className={`${DEMAND_COLORS[item.demand.toString() as keyof typeof DEMAND_COLORS]}`}>
                          {item.demand === -1 ? (
                            <span className="italic">Unassigned</span>
                          ) : (
                            DEMAND_LABELS[item.demand.toString() as keyof typeof DEMAND_LABELS]
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-foreground">Trend:</span>
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
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
} 