"use client"

import { Trade } from '@/app/types/trade';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvatarThumbnail } from '@/app/hooks/use-avatar-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

// Default avatar SVG as a base64 data URL for reliable fallback
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%232A2A2A'/%3E%3Cpath d='M75,40 C87,40 97,50 97,62 C97,74 87,84 75,84 C63,84 53,74 53,62 C53,50 63,40 75,40 Z M75,94 C98,94 116,105 116,120 L116,125 L34,125 L34,120 C34,105 52,94 75,94 Z' fill='%23666666'/%3E%3C/svg%3E";

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const { avatar, isLoading, error } = useAvatarThumbnail(trade.user.id, trade.user.avatar);
  
  useEffect(() => {
    console.log("TradeCard rendering for:", {
      userId: trade.user.id,
      initialAvatar: trade.user.avatar,
      hookResult: { avatar, isLoading, error }
    });
  }, [trade.user.id, trade.user.avatar, avatar, isLoading, error]);
  
  const statusColors = {
    Inbound: 'bg-background text-zinc-100',
    Outbound: 'bg-background text-zinc-100',
    Completed: 'bg-background text-zinc-100',
    Declined: 'bg-background text-zinc-100',
  };

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
            <h3 className="font-medium text-zinc-100">{trade.user.displayName}</h3>
            <p className="text-xs text-zinc-400">@{trade.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${statusColors[trade.status as keyof typeof statusColors]} border-zinc-800 px-2 py-0.5 text-xs font-medium`}
          >
            {trade.status}
          </Badge>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {format(parseISO(trade.created), 'MMM d, yyyy')}
        </span>
        <span className="text-xs text-zinc-400">
          {trade.items.offering.length}v{trade.items.requesting.length}
        </span>
      </div>
    </div>
  );
}