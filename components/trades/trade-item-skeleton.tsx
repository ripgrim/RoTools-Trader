"use client"

import { Skeleton } from '@/components/ui/skeleton';

export function TradeItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-none">
      <Skeleton className="w-16 h-16 rounded-none border border-zinc-800" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
} 