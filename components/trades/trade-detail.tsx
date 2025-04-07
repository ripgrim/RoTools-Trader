/* eslint-disable @next/next/no-img-element */
"use client"

import { Trade, TradeItem } from '@/app/types/trade';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Camera, CheckCircle, Circle, CircleArrowOutUpLeft, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LimitedIcon } from '@/components/ui/limited-icon';
import { RobuxIcon } from '@/components/ui/robux-icon';
import Image from 'next/image';
import { Drawer } from 'vaul';
import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { ScreenshotDialog } from './screenshot-dialog';
import { transformTradeForScreenshot } from "@/lib/utils";
import Link from 'next/link';

interface TradeDetailProps {
  trade: Trade;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TradeDetail({ trade, isOpen = true, onClose }: TradeDetailProps) {
  const tradeContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    if (!tradeContentRef.current) return;

    try {
      const canvas = await html2canvas(tradeContentRef.current, {
        backgroundColor: 'var(--background)', // Use CSS variable instead of hardcoded color
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



  const calculateDifference = useCallback((offering: TradeItem[], requesting: TradeItem[], getValue: (item: TradeItem) => number | null) => {
    const offeringTotal = calculateTotal(offering, getValue);
    const requestingTotal = calculateTotal(requesting, getValue);
    return offeringTotal - requestingTotal;
  }, [])

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
  }, [trade, calculateDifference]);

  // Helper functions for calculations
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

  const calculatePercentage = (offering: TradeItem[], requesting: TradeItem[], getValue: (item: TradeItem) => number | null) => {
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

  const content = (
    <div className="h-full bg-background">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={trade.user.avatar}
              alt={trade.user.displayName}
              className="w-12 h-12 border border-border"
            />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{trade.user.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{trade.user.name}</p>
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
        {/* Items you will give */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Items you will give
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trade.items.requesting.map((item) => (
              <div
                key={`${trade.id}-requesting-${item.id}`}
                className="flex items-center space-x-4 p-4 bg-secondary/50 border border-border rounded-none"
              >
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-16 h-16 object-cover border border-border rounded-none"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {item.name}
                    </h3>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      item.serial ? 'bg-background text-foreground' : 'bg-background/50 text-muted-foreground'
                    }`}>
                      <LimitedIcon className="w-3 h-3" />
                      <span>{item.serial || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-0 mt-2 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">RAP:</span>
                      <div className="flex items-center gap-1">
                        <RobuxIcon className="h-4 w-4 text-foreground" />
                        <span className="text-foreground">{getItemRap(item)?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Value:</span>
                      <div className="flex items-center gap-1">
                        <img
                          src="/icons/rolimons_logo_icon_blue.png"
                          alt="Rolimons"
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                        <span className="text-foreground">{getItemValue(item)?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Your Summary */}
        </div>

        {/* Items you will receive */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Items you will receive
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trade.items.offering.map((item) => (
              <div
                key={`${trade.id}-offering-${item.id}`}
                className="flex items-center space-x-4 p-4 bg-secondary/50 border border-border rounded-none"
              >
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-16 h-16 object-cover border border-border rounded-none"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {item.name}
                    </h3>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      item.serial ? 'bg-background text-foreground' : 'bg-background/50 text-muted-foreground'
                    }`}>
                      <LimitedIcon className="w-3 h-3" />
                      <span>{item.serial || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">RAP:</span>
                      <div className="flex items-center gap-1">
                        <RobuxIcon className="h-4 w-4 text-foreground" />
                        <span className="text-foreground">{getItemRap(item)?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Value:</span>
                      <div className="flex items-center gap-1">
                        <img
                          src="/icons/rolimons_logo_icon_blue.png"
                          alt="Rolimons"
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                        <span className="text-foreground">{getItemValue(item)?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="mt-6 p-4 bg-background rounded-none border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Trade Summary</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-muted-foreground mb-2">You will receive:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total RAP:</span>
                  <div className="flex items-center gap-1">
                    <RobuxIcon className="h-4 w-4 text-foreground" />
                    <span className="text-foreground">{calculateTotal(trade.items.offering, getItemRap).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Value:</span>
                  <div className="flex items-center gap-1">
                    <img
                      src="/icons/rolimons_logo_icon_blue.png"
                      alt="Rolimons"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className="text-foreground">{calculateTotal(trade.items.offering, getItemValue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-muted-foreground mb-2">You will give:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total RAP:</span>
                  <div className="flex items-center gap-1">
                    <RobuxIcon className="h-4 w-4 text-foreground" />
                    <span className="text-foreground">{calculateTotal(trade.items.requesting, getItemRap).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Value:</span>
                  <div className="flex items-center gap-1">
                    <img
                      src="/icons/rolimons_logo_icon_blue.png"
                      alt="Rolimons"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className="text-foreground">{calculateTotal(trade.items.requesting, getItemValue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trade Difference */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Value Difference:</span>
              <div className="flex items-center gap-1">
                <img
                  src="/icons/rolimons_logo_icon_blue.png"
                  alt="Rolimons"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className={`text-lg font-medium ${calculateDifference(trade.items.offering, trade.items.requesting, getItemValue) > 0 ? 'text-green-500' : calculateDifference(trade.items.offering, trade.items.requesting, getItemValue) < 0 ? 'text-red-500' : 'text-foreground'}`}>
                  {calculateDifference(trade.items.offering, trade.items.requesting, getItemValue) > 0 ? '+' : ''}{calculateDifference(trade.items.offering, trade.items.requesting, getItemValue).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-muted-foreground">RAP Difference:</span>
              <div className="flex items-center gap-1">
                <RobuxIcon className="h-4 w-4 text-foreground" />
                <span className={`text-lg font-medium ${calculateDifference(trade.items.offering, trade.items.requesting, getItemRap) > 0 ? 'text-green-500' : calculateDifference(trade.items.offering, trade.items.requesting, getItemRap) < 0 ? 'text-red-500' : 'text-foreground'}`}>
                  {calculateDifference(trade.items.offering, trade.items.requesting, getItemRap) > 0 ? '+' : ''}{calculateDifference(trade.items.offering, trade.items.requesting, getItemRap).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {trade.status === 'Inbound' && (
          <div className="py-6 border-border px-0">
            <div className="flex flex-col md:flex-row gap-4 md:justify-end">
              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto border-border text-muted-foreground hover:bg-background hover:text-foreground hover:border-border"
                onClick={() => {}}
              >
                <XCircle className="w-5 h-5 mr-2" />
                Decline Trade
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto border-border text-muted-foreground hover:bg-background hover:text-foreground hover:border-border"
                onClick={() => {}}
              >
                <ArrowLeftRight  className="w-5 h-5 mr-2" />
                Counter Trade
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-border text-muted-foreground hover:bg-background hover:text-foreground hover:border-border"
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
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-background mb-8" />
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