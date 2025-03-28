"use client"

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Camera, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Drawer } from 'vaul';

interface TradeSkeletonProps {
  isOpen?: boolean;
  onClose?: () => void;
  offeringCount?: number;
  requestingCount?: number;
}

export function TradeSkeleton({
  isOpen = true,
  onClose,
  offeringCount = 2,
  requestingCount = 2
}: TradeSkeletonProps) {
  const content = (
    <div className="h-full bg-background">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-none border border-zinc-800" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div>
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 bg-background">
        {/* Items you will give */}
        <div className="mb-8">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: requestingCount }).map((_, index) => (
              <div
                key={`requesting-${index}`}
                className="flex items-center space-x-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-none"
              >
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
            ))}
          </div>
        </div>

        {/* Items you will receive */}
        <div>
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: offeringCount }).map((_, index) => (
              <div
                key={`offering-${index}`}
                className="flex items-center space-x-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-none"
              >
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
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="mt-6 p-4 bg-zinc-900/50 rounded-none border border-zinc-800">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>
          
          {/* Trade Difference */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="py-6 border-zinc-800 px-0">
          <div className="flex flex-col md:flex-row gap-4 md:justify-end">
            <Skeleton className="h-10 w-full md:w-32" />
            <Skeleton className="h-10 w-full md:w-36" />
            <Skeleton className="h-10 w-full md:w-32" />
          </div>
        </div>
      </div>
    </div>
  );

  // For mobile, render in a drawer
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[96%] mt-24 fixed bottom-0 left-0 right-0">
            <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-none bg-zinc-800 mb-8" />
              {content}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // For desktop, render normally
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full"
    >
      {content}
    </motion.div>
  );
} 