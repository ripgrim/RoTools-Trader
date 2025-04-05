"use client"

import { Trade } from '@/app/types/trade';
import { RobuxIcon } from '@/components/ui/robux-icon';
import { LimitedIcon } from '@/components/ui/limited-icon';
import Image from 'next/image';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const formatNumber = (num: number) => num.toLocaleString();

interface TradeItem {
  id: string;
  name: string;
  thumbnail: string;
  serial?: string;
  rap?: number;
  value?: number;
}

interface TradeUser {
  displayName: string;
  avatar: string;
}

export interface ScreenshotTrade {
  id: string;
  created: string;
  sender: TradeUser;
  receiver: TradeUser;
  sending: TradeItem[];
  receiving: TradeItem[];
  sendingValue: number;
  receivingValue: number;
  valueDiff: number;
  valueDiffPercentage: number;
  type: 'Trade' | 'Offer';
}

export function TradeScreenshot({ trade }: { trade: ScreenshotTrade }) {
  return (
    <div className="bg-zinc-950 text-zinc-100 p-5 space-y-4 w-[600px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm">Trade #{trade.id}</span>
          <span className="text-zinc-400 text-sm">•</span>
          <span className="text-zinc-400 text-sm">{format(new Date(trade.created), 'MMM d, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={trade.sender.avatar} />
              <AvatarFallback>{trade.sender.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{trade.sender.displayName}</span>
          </div>
          <div className="space-y-2">
            {trade.sending.map((item) => (
              <div key={item.id} className="item-container flex items-center gap-3 bg-background/90 p-2.5 border border-zinc-800/50 rounded-none">
                <div className="relative w-10 h-10 bg-background/90 rounded-none overflow-hidden shrink-0">
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    className="object-cover"
                    fill
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-100 truncate flex-shrink">{item.name}</span>
                    {item.serial && (
                      <div className="serial-container flex items-center gap-0.5 px-1.5 rounded bg-zinc-800/80 text-zinc-300 shrink-0">
                        <LimitedIcon className="w-3 h-3" />
                        <span className="text-xs">{item.serial}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    {item.rap && (
                      <div className="flex items-center gap-1 shrink-0">
                        <RobuxIcon className="w-3 h-3" />
                        <span>{item.rap.toLocaleString()}</span>
                      </div>
                    )}
                    {item.value && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Image
                          src="/icons/rolimons_logo_icon_blue.png"
                          alt="Value"
                          width={12}
                          height={12}
                          className="object-contain"
                        />
                        <span>{item.value.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Total Value:</span>
            <span>{formatNumber(trade.sendingValue)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={trade.receiver.avatar} />
              <AvatarFallback>{trade.receiver.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{trade.receiver.displayName}</span>
          </div>
          <div className="space-y-2">
            {trade.receiving.map((item) => (
              <div key={item.id} className="item-container flex items-center gap-3 bg-background/90 p-2.5 border border-zinc-800/50 rounded-none">
                <div className="relative w-10 h-10 bg-background/90 rounded-none overflow-hidden shrink-0">
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    className="object-cover"
                    fill
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-100 truncate flex-shrink">{item.name}</span>
                    {item.serial && (
                      <div className="serial-container flex items-center gap-0.5 px-1.5 rounded bg-zinc-800/80 text-zinc-300 shrink-0">
                        <LimitedIcon className="w-3 h-3" />
                        <span className="text-xs">{item.serial}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    {item.rap && (
                      <div className="flex items-center gap-1 shrink-0">
                        <RobuxIcon className="w-3 h-3" />
                        <span>{item.rap.toLocaleString()}</span>
                      </div>
                    )}
                    {item.value && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Image
                          src="/icons/rolimons_logo_icon_blue.png"
                          alt="Value"
                          width={12}
                          height={12}
                          className="object-contain"
                        />
                        <span>{item.value.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Total Value:</span>
            <span>{formatNumber(trade.receivingValue)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/rolimons_logo_icon_blue.png"
            alt="Luma"
            width={16}
            height={16}
          />
          <span className="font-medium">Luma</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Value Diff:</span>
          <span className={cn(
            trade.valueDiff > 0 ? "text-green-400" : "text-red-400",
            "value-diff shrink-0 ml-2"
          )}>
            {trade.valueDiff > 0 ? "+" : ""}{formatNumber(trade.valueDiff)}
            <span className="text-sm ml-1.5">
              ({trade.valueDiffPercentage > 0 ? "+" : ""}
              {trade.valueDiffPercentage}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
} 