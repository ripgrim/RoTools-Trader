"use client"

import { TradeItem as TradeItemType } from '@/app/types/trade';
import { useAssetThumbnail } from '@/app/hooks/use-asset-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import { LimitedIcon } from '@/components/ui/limited-icon';
import { RobuxIcon } from '@/components/ui/robux-icon';
import Image from 'next/image';

interface TradeItemProps {
  item: TradeItemType;
}

export function TradeItem({ item }: TradeItemProps) {
  const { thumbnail, isLoading } = useAssetThumbnail(item.id, item.assetType);
  
  // Helper functions for calculations
  const getItemValue = (item: TradeItemType): number | null => {
    const value = item.value;
    return typeof value === 'number' ? value : null;
  };
  
  const getItemRap = (item: TradeItemType): number | null => {
    const rap = item.rap;
    return typeof rap === 'number' ? rap : null;
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-none">
      {isLoading ? (
        <Skeleton className="w-16 h-16 rounded-none border border-zinc-800" />
      ) : (
        <img
          src={thumbnail || item.thumbnail}
          alt={item.name}
          className="w-16 h-16 object-cover border border-zinc-800 rounded-none"
          loading="lazy"
        />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-zinc-100">
            {item.name}
          </h3>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
            item.serial ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <LimitedIcon className="w-3 h-3" />
            <span>{item.serial || 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-start gap-0 mt-2 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">RAP:</span>
            <div className="flex items-center gap-1">
              <RobuxIcon className="h-4 w-4 text-zinc-100" />
              <span className="text-zinc-100">{getItemRap(item)?.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Value:</span>
            <div className="flex items-center gap-1">
              <Image
                src="/icons/rolimons_logo_icon_blue.png"
                alt="Rolimons"
                width={16}
                height={16}
                className="object-contain"
              />
              <span className="text-zinc-100">{getItemValue(item)?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 