"use client"

import { Trade, TradeItem } from '@/app/types/trade';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvatarThumbnail } from '@/app/hooks/use-avatar-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';

// Interface for Roblox trade API response
interface RobloxAsset {
  assetId: number;
  name?: string;
  assetType?: {
    name: string;
  };
  recentAveragePrice?: number;
  thumbnail?: string;
}

interface RobloxTradeUserAsset {
  assetId: number;
  serialNumber?: number;
  asset?: RobloxAsset;
}

interface RobloxTradeOffer {
  user?: {
    id: number;
    name: string;
    displayName: string;
  };
  userAssets?: RobloxTradeUserAsset[];
}

interface RobloxTradeResponse {
  id: number;
  user: {
    id: number;
    name: string;
    displayName: string;
  };
  offers?: RobloxTradeOffer[];
  status?: string;
  created?: string;
  expiration?: string;
  isActive?: boolean;
}

// Default avatar SVG as a base64 data URL for reliable fallback
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%232A2A2A'/%3E%3Cpath d='M75,40 C87,40 97,50 97,62 C97,74 87,84 75,84 C63,84 53,74 53,62 C53,50 63,40 75,40 Z M75,94 C98,94 116,105 116,120 L116,125 L34,125 L34,120 C34,105 52,94 75,94 Z' fill='%23666666'/%3E%3C/svg%3E";

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const { avatar, isLoading, error } = useAvatarThumbnail(trade.user.id, trade.user.avatar);
  const { cookie } = useRobloxAuthContext();
  const [tradeDetails, setTradeDetails] = useState<Trade | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Helper functions for value calculations (same as in TradeDetail)
  const getItemValue = (item: TradeItem): number | null => {
    const value = item.value;
    return typeof value === 'number' ? value : null;
  };

  const getItemRap = (item: TradeItem): number | null => {
    const rap = item.rap;
    return typeof rap === 'number' ? rap : null;
  };

  const calculateTotal = (items: TradeItem[], getValue: (item: TradeItem) => number | null) => {
    const total = items.reduce((sum, item) => {
      const value = getValue(item);
      return value !== null ? sum + value : sum;
    }, 0);
    return total;
  };

  const calculateDifference = (offering: TradeItem[], requesting: TradeItem[], getValue: (item: TradeItem) => number | null) => {
    const offeringTotal = calculateTotal(offering, getValue);
    const requestingTotal = calculateTotal(requesting, getValue);
    return offeringTotal - requestingTotal;
  };

  const calculatePercentage = (offering: TradeItem[], requesting: TradeItem[], getValue: (item: TradeItem) => number | null) => {
    const offeringTotal = calculateTotal(offering, getValue);
    const requestingTotal = calculateTotal(requesting, getValue);
    if (requestingTotal === 0) return 0;
    return Math.round(((offeringTotal - requestingTotal) / requestingTotal) * 100);
  };

  // Fetch trade details if needed for value comparison
  useEffect(() => {
    // Only fetch if we don't have items and we're not already fetching
    const needsDetails = trade.items.offering.length === 0 && trade.items.requesting.length === 0;

    if (needsDetails && !isFetchingDetails && !tradeDetails && cookie) {
      setIsFetchingDetails(true);

      console.log(`Fetching details for trade ${trade.id} for value display`);
      fetch(`/api/roblox/trades/${trade.id}`, {
        method: 'GET',
        headers: {
          'x-roblox-cookie': cookie,
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch trade details: ${response.status}`);
          }
          return response.json();
        })
        .then((data: RobloxTradeResponse) => {
          console.log(`Received details for trade ${trade.id}`);
          // Transform the API data to our Trade format
          // We'll only update the items arrays since that's all we need
          setTradeDetails({
            ...trade,
            items: {
              offering: data.offers?.find((offer) => offer.user?.id === data.user.id)?.userAssets?.map((item) => ({
                id: item.assetId,
                name: item.asset?.name || 'Unknown Item',
                assetType: item.asset?.assetType?.name || 'Item',
                thumbnail: item.asset?.thumbnail || '',
                rap: item.asset?.recentAveragePrice || 0,
                value: item.asset?.recentAveragePrice || 0,
                serial: item.serialNumber?.toString() || null
              })) || [],
              requesting: data.offers?.find((offer) => offer.user?.id !== data.user.id)?.userAssets?.map((item) => ({
                id: item.assetId,
                name: item.asset?.name || 'Unknown Item',
                assetType: item.asset?.assetType?.name || 'Item',
                thumbnail: item.asset?.thumbnail || '',
                rap: item.asset?.recentAveragePrice || 0,
                value: item.asset?.recentAveragePrice || 0,
                serial: item.serialNumber?.toString() || null
              })) || []
            }
          });
        })
        .catch((err: Error) => {
          console.error(`Error fetching trade details for card: ${err}`);
        })
        .finally(() => {
          setIsFetchingDetails(false);
        });
    }
  }, [trade, cookie, isFetchingDetails, tradeDetails]);

  // Use tradeDetails if available, otherwise use the passed trade
  const currentTrade = tradeDetails || trade;

  const statusColors = {
    Inbound: 'bg-background text-zinc-100',
    Outbound: 'bg-background text-zinc-100',
    Completed: 'bg-background text-zinc-100',
    Declined: 'bg-background text-zinc-100',
  };

  // Calculate trade values using the functions from TradeDetail
  const offeringValue = calculateTotal(currentTrade.items.offering, getItemValue);
  const requestingValue = calculateTotal(currentTrade.items.requesting, getItemValue);
  const valueDiff = calculateDifference(currentTrade.items.offering, currentTrade.items.requesting, getItemValue);
  const valueDiffPercent = calculatePercentage(currentTrade.items.offering, currentTrade.items.requesting, getItemValue);

  // Also calculate RAP differences
  const rapDiff = calculateDifference(currentTrade.items.offering, currentTrade.items.requesting, getItemRap);
  const rapDiffPercent = calculatePercentage(currentTrade.items.offering, currentTrade.items.requesting, getItemRap);

  const isValueGain = valueDiff > 0;
  const isValueEqual = valueDiff === 0;
  const isRapGain = rapDiff > 0;
  const isRapEqual = rapDiff === 0;
  const hasItems = currentTrade.items.offering.length > 0 || currentTrade.items.requesting.length > 0;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <Skeleton className="w-8 h-8 border border-zinc-800" />
          ) : (
            <img
              src={avatar || DEFAULT_AVATAR}
              alt={trade.user.displayName}
              className="w-8 h-8 border border-zinc-800"
              onError={(e) => {
                console.error("Image failed to load:", e);
                // Use a reliable fallback that won't trigger another error
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          )}
          <div>
            <h3 className="font-medium text-zinc-100 truncate max-w-[140px]">{trade.user.displayName}</h3>
            <p className="text-xs text-zinc-400">@{trade.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${statusColors[trade.status as keyof typeof statusColors]} border-zinc-800 rounded-full px-2 py-0.5 text-xs font-medium`}
          >
            {trade.status}
          </Badge>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">
            {format(parseISO(trade.created), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Trade value display states */}
        {isFetchingDetails ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs border border-zinc-800/50 bg-zinc-900/20 text-zinc-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading values...</span>
          </div>
        ) : hasItems ? (
          <div className="flex flex-col gap-1">
            {/* Value Difference */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs border",
              isValueGain
                ? "text-green-500 border-green-900/50 bg-green-950/20"
                : isValueEqual
                  ? "text-zinc-400 border-zinc-800/50 bg-zinc-900/20"
                  : "text-red-500 border-red-900/50 bg-red-950/20"
            )}>
              {isValueGain ? (
                <TrendingUp className="w-3 h-3" />
              ) : isValueEqual ? (
                <span className="w-3 h-3 flex items-center justify-center">=</span>
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="whitespace-nowrap">
                {isValueEqual ? (
                  <span>= 0 <span className="opacity-70">VAL</span></span>
                ) : (
                  <>
                    {isValueGain ? '+' : ''}
                    {valueDiff.toLocaleString()} <span className="opacity-70">VAL</span>
                  </>
                )}
              </span>
            </div>

            {/* RAP Difference */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs border",
              isRapGain
                ? "text-green-500 border-green-900/50 bg-green-950/20"
                : isRapEqual
                  ? "text-zinc-400 border-zinc-800/50 bg-zinc-900/20"
                  : "text-red-500 border-red-900/50 bg-red-950/20"
            )}>
              {isRapGain ? (
                <TrendingUp className="w-3 h-3" />
              ) : isRapEqual ? (
                <span className="w-3 h-3 flex items-center justify-center">=</span>
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="whitespace-nowrap">
                {isRapEqual ? (
                  <span>= 0 <span className="opacity-70">RAP</span></span>
                ) : (
                  <>
                    {isRapGain ? '+' : ''}
                    {rapDiff.toLocaleString()} <span className="opacity-70">RAP</span>
                  </>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-2 py-1 rounded-sm text-xs border border-zinc-800/50 bg-zinc-900/20 text-zinc-400">
            {trade.status === 'Inbound' ? 'Trade Request' :
              trade.status === 'Outbound' ? 'Sent Offer' :
                trade.status === 'Completed' ? 'Completed' : 'Trade'}
          </div>
        )}
      </div>
    </div>
  );
}