"use client"

import { Trade, TradeItem as TradeItemType } from '@/app/types/trade';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Camera, CheckCircle, Circle, CircleArrowOutUpLeft, XCircle, Loader2, Construction, HardHat, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { LimitedIcon } from '@/components/ui/limited-icon';
import { RobuxIcon } from '@/components/ui/robux-icon';
import Image from 'next/image';
import { Drawer } from 'vaul';
import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { ScreenshotDialog } from './screenshot-dialog';
import { transformTradeForScreenshot, formatNumber, transformTradeForDetail } from "@/lib/utils";
import { useAvatarThumbnail } from '@/app/hooks/use-avatar-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeItem as TradeItemComponent } from './trade-item';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useTradeActions } from '@/app/providers/trade-actions-provider';
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useItemDetails } from '@/app/hooks/use-item-details';

interface TradeDetailProps {
  trade: Trade;
  isOpen: boolean;
  onClose: (open: boolean) => void;
  avatarUrl?: string;
}

export function TradeDetail({ trade: initialTrade, isOpen, onClose, avatarUrl }: TradeDetailProps) {
  const tradeContentRef = useRef<HTMLDivElement>(null);
  const [trade, setTrade] = useState(initialTrade);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isCountering] = useState(false);
  const [isSyncingValues, setIsSyncingValues] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isLoadingFreshTrade, setIsLoadingFreshTrade] = useState(false);
  const { avatar, isLoading: isAvatarLoading } = useAvatarThumbnail(trade.user.id, trade.user.avatar);
  const { cookie } = useRobloxAuthContext();
  const { toast } = useToast();
  const { acceptTrade, declineTrade, counterTrade, refreshInboundCount } = useTradeActions();
  const router = useRouter();
  const { getItemDetails } = useItemDetails();

  // Fetch fresh trade data when the drawer is opened
  useEffect(() => {
    // Only fetch data when the drawer is open
    if (!isOpen || !initialTrade.id || !cookie) return;
    
    const fetchFreshTradeData = async () => {
      // Check if the initial trade already has current values 
      // (might be prefetched by the trade list)
      const hasCompleteTrade = initialTrade.items &&
        initialTrade.items.offering?.every(item => item.value != null) &&
        initialTrade.items.requesting?.every(item => item.value != null);
      
      if (hasCompleteTrade) {
        console.log(`Trade ${initialTrade.id} already has complete data, skipping fetch`);
        setTrade(initialTrade);
        setLastRefreshed(new Date());
        return;
      }
      
      setIsLoadingFreshTrade(true);
      try {
        console.log(`Fetching fresh data for trade ${initialTrade.id}`);
        const response = await fetch(`/api/roblox/trades/${initialTrade.id}`, {
          headers: {
            'x-roblox-cookie': cookie,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch fresh trade data: ${response.status}`);
        }
        
        const freshTradeData = await response.json();
        console.log('Fetched fresh trade data:', freshTradeData);
        
        // Transform the trade data
        const transformedTrade = transformTradeForDetail(freshTradeData);
        
        // Update trade state
        setTrade(transformedTrade);
        setLastRefreshed(new Date());
        console.log('Updated trade with fresh data');
        
        // Immediately fetch values for all items in the trade
        await fetchItemValues(transformedTrade);
      } catch (error) {
        console.error('Error fetching fresh trade data:', error);
        // Fall back to the initial trade data if fetch fails
        toast({
          title: "Warning",
          description: "Using cached trade data. Some values may be outdated.",
          variant: "default"
        });
      } finally {
        setIsLoadingFreshTrade(false);
      }
    };
    
    fetchFreshTradeData();
  }, [isOpen, initialTrade, cookie]);
  
  // Function to fetch current values for all items in the trade
  const fetchItemValues = async (currentTrade: Trade) => {
    setIsSyncingValues(true);
    console.log("Fetching current values for all items in trade");
    
    try {
      const updatedTrade = { ...currentTrade };
      let valueChanged = false;
      
      // Process offering items
      for (let i = 0; i < updatedTrade.items.offering.length; i++) {
        const item = updatedTrade.items.offering[i];
        try {
          const details = await getItemDetails(item.id);
          if (details) {
            // Check if value has changed
            if (item.value !== details.value) {
              valueChanged = true;
              console.log(`Item ${item.id} (${item.name}) value changed: ${item.value} → ${details.value}`);
            }
            
            // Update item with fresh values
            updatedTrade.items.offering[i] = {
              ...item,
              value: details.value,
              rap: details.rap
            };
          }
        } catch (err) {
          console.error(`Failed to fetch details for item ${item.id}:`, err);
        }
      }
      
      // Process requesting items
      for (let i = 0; i < updatedTrade.items.requesting.length; i++) {
        const item = updatedTrade.items.requesting[i];
        try {
          const details = await getItemDetails(item.id);
          if (details) {
            // Check if value has changed
            if (item.value !== details.value) {
              valueChanged = true;
              console.log(`Item ${item.id} (${item.name}) value changed: ${item.value} → ${details.value}`);
            }
            
            // Update item with fresh values
            updatedTrade.items.requesting[i] = {
              ...item,
              value: details.value,
              rap: details.rap
            };
          }
        } catch (err) {
          console.error(`Failed to fetch details for item ${item.id}:`, err);
        }
      }
      
      // Update the trade with fresh values
      setTrade(updatedTrade);
      setLastRefreshed(new Date());
      
      if (valueChanged) {
        toast({
          title: "Values Updated",
          description: "Item values have been updated to the latest.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error fetching item values:", error);
    } finally {
      setIsSyncingValues(false);
    }
  };

  // Helper functions for calculations
  const getItemValue = (item: TradeItemType): number | null => {
    const value = item.value;
    return typeof value === 'number' ? value : null;
  };
  
  const getItemRap = (item: TradeItemType): number | null => {
    const rap = item.rap;
    return typeof rap === 'number' ? rap : null;
  };

  // New function to get preferred value, prioritizing value over RAP
  const getPreferredValue = (item: TradeItemType): number | null => {
    // Get the value, or if it's -1 (unvalued), treat as null
    const value = getItemValue(item);
    const hasValidValue = value !== null && value !== -1;
    
    // Return value if it exists and is valid, otherwise fallback to RAP
    return hasValidValue ? value : getItemRap(item);
  };

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
          preferredValue: getPreferredValue(item),
          serial: item.serial,
          thumbnail: item.thumbnail
        })),
        offering: trade.items.offering.map(item => ({
          name: item.name,
          rap: getItemRap(item),
          value: getItemValue(item),
          preferredValue: getPreferredValue(item),
          serial: item.serial,
          thumbnail: item.thumbnail
        }))
      },
      totals: {
        requesting: {
          rap: calculateTotal(trade.items.requesting, getItemRap),
          value: calculateTotal(trade.items.requesting, getItemValue),
          effective: calculateTotal(trade.items.requesting, getPreferredValue)
        },
        offering: {
          rap: calculateTotal(trade.items.offering, getItemRap),
          value: calculateTotal(trade.items.offering, getItemValue),
          effective: calculateTotal(trade.items.offering, getPreferredValue)
        }
      },
      differences: {
        rap: calculateDifference(trade.items.offering, trade.items.requesting, getItemRap),
        value: calculateDifference(trade.items.offering, trade.items.requesting, getItemValue),
        effective: calculateDifference(trade.items.offering, trade.items.requesting, getPreferredValue)
      },
      percentages: {
        rap: calculatePercentage(trade.items.offering, trade.items.requesting, getItemRap),
        value: calculatePercentage(trade.items.offering, trade.items.requesting, getItemValue),
        effective: calculatePercentage(trade.items.offering, trade.items.requesting, getPreferredValue)
      }
    });
  }, [trade]);
  
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

  const handleAcceptTrade = async () => {
    if (isAccepting) return;
    
    setIsAccepting(true);
    try {
      await acceptTrade(trade.id);
      toast({
        title: "Trade Accepted",
        description: "You have accepted the trade.",
      });
      refreshInboundCount();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept trade",
        variant: "destructive"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineTrade = async () => {
    if (isDeclining) return;
    
    setIsDeclining(true);
    try {
      await declineTrade(trade.id);
      toast({
        title: "Trade Declined",
        description: "You have declined the trade.",
      });
      refreshInboundCount();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to decline trade",
        variant: "destructive"
      });
    } finally {
      setIsDeclining(false);
    }
  };

  const handleCounterTrade = () => {
    toast({
      title: "Under Construction",
      description: "The counter trade feature is coming soon!",
      variant: "default"
    });
  };

  // New function to sync all item values
  const syncAllItemValues = async () => {
    if (isSyncingValues) return;
    
    toast({
      title: "Syncing values",
      description: "Fetching the latest item values from the API...",
    });
    
    await fetchItemValues(trade);
  };

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
        {/* Trade Comparison Banner */}
        <div className="mb-6">
          <div className="relative h-10 bg-zinc-900/50 border border-zinc-800 overflow-hidden">
            {/* Calculate value difference percentage */}
            {(() => {
              const offeringValue = calculateTotal(trade.items.offering, getPreferredValue);
              const requestingValue = calculateTotal(trade.items.requesting, getPreferredValue);
              const difference = offeringValue - requestingValue;
              const percentage = requestingValue > 0 
                ? (difference / requestingValue) * 100 
                : 0;
              
              // Cap at reasonable visuals
              const cappedPercentage = Math.min(Math.max(percentage, -100), 100);
              const position = 50 + (cappedPercentage / 2);
              
              // Calculate colors based on win/loss
              const startColor = difference > 0 ? 'from-green-800/20' : 'from-red-800/20';
              const endColor = difference > 0 ? 'to-green-500/30' : 'to-red-500/30';
              
              return (
                <>
                  {/* Gradient background representing win/loss */}
                  <div 
                    className={`absolute top-0 bottom-0 bg-gradient-to-r ${startColor} ${endColor}`}
                    style={{ 
                      left: difference > 0 ? '50%' : `${position}%`, 
                      right: difference > 0 ? `${100 - position}%` : '50%',
                    }}
                  />
                  
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700" />
                  
                  {/* Value display */}
                  <div className="flex h-full justify-between items-center relative z-10 px-4">
                    <div className="text-white font-medium text-sm">
                      {formatNumber(requestingValue)} R$
                    </div>
                    <div className="text-white text-xs font-bold">
                      {difference === 0 ? (
                        <span className="text-zinc-400">EVEN</span>
                      ) : difference > 0 ? (
                        <span className="text-green-400">+{formatNumber(difference)} R$ ({percentage > 0 ? '+' : ''}{percentage.toFixed(0)}%)</span>
                      ) : (
                        <span className="text-red-400">{formatNumber(difference)} R$ ({percentage.toFixed(0)}%)</span>
                      )}
                    </div>
                    <div className="text-white font-medium text-sm">
                      {formatNumber(offeringValue)} R$
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1 px-1">
            <div>You Give</div>
            <div>You Receive</div>
          </div>
        </div>
        
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-100">Trade Summary</h3>
            <div className="flex items-center gap-2">
              <div className="text-xs text-zinc-500">
                {isLoadingFreshTrade ? (
                  <span className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Loading fresh data...
                  </span>
                ) : isSyncingValues ? (
                  <span className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <span>
                    Values as of {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs gap-1.5 h-7 border-zinc-700"
                onClick={syncAllItemValues}
                disabled={isSyncingValues || isLoadingFreshTrade}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingValues || isLoadingFreshTrade ? 'animate-spin' : ''}`} />
                Sync Values
              </Button>
            </div>
          </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Effective Total:</span>
                  <div className="flex items-center gap-1 text-blue-500 font-semibold">
                    <span className="text-zinc-100 group relative">
                      {calculateTotal(trade.items.offering, getPreferredValue).toLocaleString()}
                      <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Uses item value when available, falls back to RAP when value is not set
                      </span>
                    </span>
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
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Effective Total:</span>
                  <div className="flex items-center gap-1 text-blue-500 font-semibold">
                    <span className="text-zinc-100 group relative">
                      {calculateTotal(trade.items.requesting, getPreferredValue).toLocaleString()}
                      <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Uses item value when available, falls back to RAP when value is not set
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trade Difference */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 flex items-center gap-1">
                Effective Difference:
                <span className="relative group">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Combined calculation using item values when available and RAP as fallback. This is the most accurate representation of the trade's fairness.
                  </span>
                </span>
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-lg font-medium ${calculateDifference(trade.items.offering, trade.items.requesting, getPreferredValue) > 0 ? 'text-green-500' : calculateDifference(trade.items.offering, trade.items.requesting, getPreferredValue) < 0 ? 'text-red-500' : 'text-zinc-100'}`}>
                  {calculateDifference(trade.items.offering, trade.items.requesting, getPreferredValue) > 0 ? '+' : ''}{calculateDifference(trade.items.offering, trade.items.requesting, getPreferredValue).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
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
                size="lg"
                className="w-full md:w-auto border-zinc-800 text-zinc-400 hover:bg-background hover:text-zinc-100 hover:border-zinc-600"
                onClick={handleDeclineTrade}
                disabled={isDeclining || isAccepting}
              >
                {isDeclining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Decline Trade
                  </>
                )}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full md:w-auto border-zinc-800 text-zinc-400 hover:bg-background hover:text-zinc-100 hover:border-zinc-600 group relative overflow-hidden"
                      onClick={handleCounterTrade}
                      disabled={true}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/40 to-white/20 via-black/10 bg-[length:400%_100%] animate-caution-stripe" />
                      <div className="relative flex items-center">
                        <Construction className="w-5 h-5 mr-2" />
                        <span className="relative">
                          Counter Trade
                          <span className="absolute -top-1 -right-2 text-[8px] bg-white text-black px-1 py-0.5 rounded-sm font-bold tracking-tighter rotate-12">SOON!</span>
                        </span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-white" />
                      <span>Counter trade functionality is under construction! Check back soon for this exciting feature.</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-zinc-800 text-zinc-400 hover:bg-background hover:text-zinc-100 hover:border-zinc-600"
                onClick={handleAcceptTrade}
                disabled={isAccepting || isDeclining}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Accept Trade
                  </>
                )}
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