"use client"

import { Trade, TradeItem as TradeItemType } from '@/app/types/trade';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Camera, CheckCircle, Circle, CircleArrowOutUpLeft, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LimitedIcon } from '@/components/ui/limited-icon';
import { RobuxIcon } from '@/components/ui/robux-icon';
import Image from 'next/image';
import { Drawer } from 'vaul';
import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { ScreenshotDialog } from './screenshot-dialog';
import { transformTradeForScreenshot } from "@/lib/utils";
import { useAvatarThumbnail } from '@/app/hooks/use-avatar-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeItem as TradeItemComponent } from './trade-item';

interface TradeDetailProps {
  trade: Trade;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TradeDetail({ trade, isOpen = true, onClose }: TradeDetailProps) {
  const tradeContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { avatar, isLoading: isAvatarLoading } = useAvatarThumbnail(trade.user.id, trade.user.avatar);

  const generateImage = async () => {
    if (!tradeContentRef.current) return;

    try {
      const canvas = await html2canvas(tradeContentRef.current, {
        backgroundColor: '#18181B', // zinc-900
        scale: 2, // Higher quality
      });

      // Convert to blob
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trade-${trade.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to generate image:', error);
    }
  };

  // Update the effect to reset isGenerating when dialog closes
  useEffect(() => {
    if (!isScreenshotOpen) {
      setIsGenerating(false);
    }
  }, [isScreenshotOpen]);

  // Add logging for rendered content
  useEffect(() => {
    console.log('Rendered Trade Detail:', {
      tradeId: trade.id,
      user: trade.user,
      status: trade.status,
      renderedItems: {
        requesting: trade.items.requesting.map(item => ({
          name: item.name,
          rap: getItemRap(item),
          value: getItemValue(item),
          serial: item.serial,
          thumbnail: item.thumbnail
        })),
        offering: trade.items.offering.map(item => ({
          name: item.name,
          rap: getItemRap(item),
          value: getItemValue(item),
          serial: item.serial,
          thumbnail: item.thumbnail
        }))
      },
      totals: {
        requesting: {
          rap: calculateTotal(trade.items.requesting, getItemRap),
          value: calculateTotal(trade.items.requesting, getItemValue)
        },
        offering: {
          rap: calculateTotal(trade.items.offering, getItemRap),
          value: calculateTotal(trade.items.offering, getItemValue)
        }
      },
      differences: {
        rap: calculateDifference(trade.items.offering, trade.items.requesting, getItemRap),
        value: calculateDifference(trade.items.offering, trade.items.requesting, getItemValue)
      }
    });
  }, [trade]);

  // Helper functions for calculations
  const getItemValue = (item: TradeItemType): number | null => {
    const value = item.value;
    return typeof value === 'number' ? value : null;
  };
  
  const getItemRap = (item: TradeItemType): number | null => {
    const rap = item.rap;
    return typeof rap === 'number' ? rap : null;
  };
  
  const calculateTotal = (items: TradeItemType[], getValue: (item: TradeItemType) => number | null) => {
    const total = items.reduce((sum, item) => {
      const value = getValue(item);
      return value !== null ? sum + value : sum;
    }, 0);
    return total;
  };

  const calculateDifference = (offering: TradeItemType[], requesting: TradeItemType[], getValue: (item: TradeItemType) => number | null) => {
    const offeringTotal = calculateTotal(offering, getValue);
    const requestingTotal = calculateTotal(requesting, getValue);
    return offeringTotal - requestingTotal;
  };

  const calculatePercentage = (offering: TradeItemType[], requesting: TradeItemType[], getValue: (item: TradeItemType) => number | null) => {
    const offeringTotal = calculateTotal(offering, getValue);
    const requestingTotal = calculateTotal(requesting, getValue);
    if (requestingTotal === 0) return 0;
    return ((offeringTotal - requestingTotal) / requestingTotal) * 100;
  };

  const getExpirationText = () => {
    if (!trade.expiration) return null;
    
    const expirationDate = parseISO(trade.expiration);
    const now = new Date();
    
    if (expirationDate < now) {
      return "Expired";
    }
    
    return `Expires in ${formatDistanceToNow(expirationDate)}`;
  };

  // Add a function to get the appropriate heading based on trade status
  const getItemHeadings = () => {
    // For completed trades, use past tense
    if (trade.status === 'Completed' || trade.status === 'Declined') {
      return {
        requesting: "Items you gave",
        offering: "Items you received"
      };
    }
    
    // For pending trades (inbound/outbound), use future tense
    return {
      requesting: "Items you will give",
      offering: "Items you will receive"
    };
  };

  // Get the appropriate headings
  const headings = getItemHeadings();

  const content = (
    <div className="h-full bg-background">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isAvatarLoading ? (
              <Skeleton className="w-12 h-12 border border-zinc-800" />
            ) : (
              <img
                src={avatar || trade.user.avatar}
                alt={trade.user.displayName}
                className="w-12 h-12 border border-zinc-800"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{trade.user.displayName}</h2>
              <p className="text-sm text-zinc-400">@{trade.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setIsGenerating(true);
                setIsScreenshotOpen(true);
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Screenshot
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div ref={tradeContentRef} className="p-6 space-y-8 bg-background">
        {/* Items you will give/gave */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            {headings.requesting}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trade.items.requesting.map((item) => (
              <TradeItemComponent key={`${trade.id}-requesting-${item.id}`} item={item} />
            ))}
          </div>
          {/* Your Summary */}
        </div>

        {/* Items you will receive/received */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            {headings.offering}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trade.items.offering.map((item) => (
              <TradeItemComponent key={`${trade.id}-offering-${item.id}`} item={item} />
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="mt-6 p-4 bg-zinc-900/50 rounded-none border border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Trade Summary</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-zinc-400 mb-2">
                {trade.status === 'Completed' || trade.status === 'Declined' 
                  ? "You received:" 
                  : "You will receive:"}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Total RAP:</span>
                  <div className="flex items-center gap-1">
                    <RobuxIcon className="h-4 w-4 text-zinc-100" />
                    <span className="text-zinc-100">{calculateTotal(trade.items.offering, getItemRap).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Total Value:</span>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/icons/rolimons_logo_icon_blue.png"
                      alt="Rolimons"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className="text-zinc-100">{calculateTotal(trade.items.offering, getItemValue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-zinc-400 mb-2">
                {trade.status === 'Completed' || trade.status === 'Declined' 
                  ? "You gave:" 
                  : "You will give:"}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Total RAP:</span>
                  <div className="flex items-center gap-1">
                    <RobuxIcon className="h-4 w-4 text-zinc-100" />
                    <span className="text-zinc-100">{calculateTotal(trade.items.requesting, getItemRap).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Total Value:</span>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/icons/rolimons_logo_icon_blue.png"
                      alt="Rolimons"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className="text-zinc-100">{calculateTotal(trade.items.requesting, getItemValue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trade Difference */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Value Difference:</span>
              <div className="flex items-center gap-1">
                <Image
                  src="/icons/rolimons_logo_icon_blue.png"
                  alt="Rolimons"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className={`text-lg font-medium ${calculateDifference(trade.items.offering, trade.items.requesting, getItemValue) > 0 ? 'text-green-500' : calculateDifference(trade.items.offering, trade.items.requesting, getItemValue) < 0 ? 'text-red-500' : 'text-zinc-100'}`}>
                  {calculateDifference(trade.items.offering, trade.items.requesting, getItemValue) > 0 ? '+' : ''}{calculateDifference(trade.items.offering, trade.items.requesting, getItemValue).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-zinc-400">RAP Difference:</span>
              <div className="flex items-center gap-1">
                <RobuxIcon className="h-4 w-4 text-zinc-100" />
                <span className={`text-lg font-medium ${calculateDifference(trade.items.offering, trade.items.requesting, getItemRap) > 0 ? 'text-green-500' : calculateDifference(trade.items.offering, trade.items.requesting, getItemRap) < 0 ? 'text-red-500' : 'text-zinc-100'}`}>
                  {calculateDifference(trade.items.offering, trade.items.requesting, getItemRap) > 0 ? '+' : ''}{calculateDifference(trade.items.offering, trade.items.requesting, getItemRap).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {trade.status === 'Inbound' && (
          <div className="py-6 border-zinc-800 px-0">
            <div className="flex flex-col md:flex-row gap-4 md:justify-end">
              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto border-zinc-800 text-zinc-400 hover:bg-background hover:text-zinc-100 hover:border-zinc-600"
                onClick={() => {}}
              >
                <XCircle className="w-5 h-5 mr-2" />
                Decline Trade
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto border-zinc-800 text-zinc-400 hover:bg-background hover:text-zinc-100 hover:border-zinc-600"
                onClick={() => {}}
              >
                <ArrowLeftRight  className="w-5 h-5 mr-2" />
                Counter Trade
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-zinc-800 text-zinc-400 hover:bg-background hover:text-zinc-100 hover:border-zinc-600"
                onClick={() => {}}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Accept Trade
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScreenshotDialog
        trade={transformTradeForScreenshot(trade)}
        open={isScreenshotOpen}
        onOpenChange={setIsScreenshotOpen}
      />
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
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 mb-8" />
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