/* eslint-disable @next/next/no-img-element */
"use client"

import { Trade } from '@/app/types/trade';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const statusColors = {
    Inbound: 'bg-background text-foreground',
    Outbound: 'bg-background text-foreground',
    Completed: 'bg-background text-foreground',
    Declined: 'bg-background text-foreground',
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={trade.user.avatar || `https://www.roblox.com/headshot-thumbnail/image?userId=${trade.user.id}&width=50&height=50`}
            alt={trade.user.displayName}
            className="w-8 h-8 border border-border"
          />
          <div>
            <h3 className="font-medium text-foreground">{trade.user.displayName}</h3>
            <p className="text-xs text-muted-foreground">@{trade.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${statusColors[trade.status as keyof typeof statusColors]} border-border px-2 py-0.5 text-xs font-medium`}
          >
            {trade.status}
          </Badge>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(parseISO(trade.created), 'MMM d, yyyy')}
        </span>
        <span className="text-xs text-muted-foreground">
          {trade.items.offering.length}v{trade.items.requesting.length}
        </span>
      </div>
    </div>
  );
}