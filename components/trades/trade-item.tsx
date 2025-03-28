"use client"

import { TradeItem as TradeItemType } from '@/app/types/trade';
import { Skeleton } from '@/components/ui/skeleton';
import { LimitedIcon } from '@/components/ui/limited-icon';
import Image from 'next/image';
import { useState } from 'react';
import { ItemDetails } from '@/components/trades/item-details';

interface TradeItemProps {
  item: TradeItemType;
}

export function TradeItem({ item }: TradeItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get placeholder image based on asset type
  const getPlaceholderImage = () => {
    const type = item.assetType || 'Item';
    return `/placeholders/${type.toLowerCase()}_placeholder.png`;
  };

  return (
    <div className="flex items-center gap-4 p-4 border border-zinc-800 bg-zinc-900/50 rounded-none">
      <div className="relative h-16 w-16 rounded-none overflow-hidden bg-zinc-800 flex-shrink-0">
        {!imageLoaded && !imageError && (
          <Skeleton className="h-full w-full bg-zinc-800 absolute inset-0" />
        )}
        <Image
          src={imageError ? getPlaceholderImage() : item.thumbnail}
          alt={item.name}
          width={64}
          height={64}
          className={`object-contain w-full h-full ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <h3 className="text-zinc-100 font-medium text-sm truncate mr-2">
            {item.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-white">
            {item.serial && (
              <>
                <LimitedIcon className="h-4 w-4 flex-shrink-0" />
                #{item.serial}
              </>
            )}
            
          </div>
        </div>

        {/* Item details component */}
        <div className="mt-1">
          <ItemDetails itemId={item.id} />
        </div>
      </div>
    </div>
  );
} 