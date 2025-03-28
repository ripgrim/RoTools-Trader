"use client"

import { Trade } from '@/app/types/trade';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvatarThumbnail } from '@/app/hooks/use-avatar-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const { avatar, isLoading } = useAvatarThumbnail(trade.user.id, trade.user.avatar);
  
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
              src={avatar || `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter`}
              alt={trade.user.displayName}
              className="w-8 h-8 border border-zinc-800"
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