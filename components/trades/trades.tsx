"use client"

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeList } from './trade-list';
import { Trade } from '@/app/types/trade';
import { TradeDetail } from './trade-detail';
import { useTradeDetails } from '@/app/hooks/use-trade-details';
import { TradeSkeleton } from './trade-skeleton';
import { TradeItemSkeleton } from './trade-item-skeleton';

interface TradesProps {
  trades: Trade[];
}

export function Trades({ trades }: TradesProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('inbound');
  
  // Fetch detailed trade information for the selected trade
  const { trade: detailedTrade, isLoading: isTradeLoading, error: tradeError } = useTradeDetails(selectedTradeId);
  
  // We'll use either the detailed trade (if loaded) or the original list item
  const [displayTrade, setDisplayTrade] = useState<Trade | null>(null);

  // Handle window resize and initial mobile check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-select first trade on desktop
  useEffect(() => {
    if (!isMobile && trades.length > 0 && !selectedTradeId) {
      setSelectedTradeId(trades[0].id);
      setDisplayTrade(trades[0]);
      setIsDrawerOpen(false);
    }
  }, [trades, isMobile, selectedTradeId]);

  // Update the display trade when detailed trade data is loaded
  useEffect(() => {
    if (detailedTrade) {
      // If we have a detailed trade, use it
      setDisplayTrade(detailedTrade);
    } else if (selectedTradeId && !isTradeLoading) {
      // If loading failed or there's an error, fall back to the list item
      const fallbackTrade = trades.find(t => t.id === selectedTradeId);
      if (fallbackTrade) setDisplayTrade(fallbackTrade);
    }
  }, [detailedTrade, isTradeLoading, selectedTradeId, trades]);

  const handleTradeSelect = (trade: Trade) => {
    console.log('Selected Trade:', {
      id: trade.id,
      user: trade.user.name,
      status: trade.status
    });
    
    // First, check if this is a different trade than currently selected
    if (selectedTradeId !== trade.id) {
      // If switching to a different trade, clear current display first
      setDisplayTrade(null);
      // Then set the new ID which will trigger the data fetch
      setSelectedTradeId(trade.id);
      // After clearing, set the basic trade info for immediate display while loading detailed data
      // Use a timeout to ensure state updates are processed in the correct order
      setTimeout(() => {
        // Create a clean copy to avoid reference issues
        const cleanTrade = JSON.parse(JSON.stringify(trade));
        setDisplayTrade(cleanTrade);
      }, 0);
    }
    
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedTradeId(null);
    setDisplayTrade(null);
    setIsDrawerOpen(false);
  };

  // Render the trade details or a loading state
  const renderTradeDetail = () => {
    if (!displayTrade) return null;
    
    // Check if we're loading a new trade (using ID comparison)
    const isLoadingNewTrade = isTradeLoading && (!detailedTrade || detailedTrade.id !== displayTrade.id);
    
    if (isLoadingNewTrade) {
      // Show skeleton when loading a new trade's details
      return (
        <TradeSkeleton 
          isOpen={!isMobile || isDrawerOpen}
          onClose={handleDrawerClose}
          requestingCount={displayTrade.items.requesting.length}
          offeringCount={displayTrade.items.offering.length}
        />
      );
    }
    
    // If we have the detailed trade data or are falling back to list data
    return (
      <TradeDetail 
        trade={displayTrade} 
        isOpen={!isMobile || isDrawerOpen}
        onClose={handleDrawerClose}
      />
    );
  };

  return (
    <div className="flex h-full">
      <div className="w-full md:w-[400px] md:border-r border-zinc-800 h-full overflow-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <TabsList className="justify-start px-6 py-6 bg-transparent border-b border-zinc-800">
            <TabsTrigger value="inbound" className="data-[state=active]:bg-background">
              Inbound
            </TabsTrigger>
            <TabsTrigger value="outbound" className="data-[state=active]:bg-background">
              Outbound
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-background">
              Completed
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inbound" className="flex-1 px-6 py-4">
            <TradeList 
              trades={trades.filter(t => t.status === 'Inbound')}
              selectedTrade={displayTrade}
              onSelectTrade={handleTradeSelect}
              type="inbound"
            />
          </TabsContent>
          <TabsContent value="outbound" className="flex-1 px-6 py-4">
            <TradeList 
              trades={trades.filter(t => t.status === 'Outbound')}
              selectedTrade={displayTrade}
              onSelectTrade={handleTradeSelect}
              type="outbound"
            />
          </TabsContent>
          <TabsContent value="completed" className="flex-1 px-6 py-4">
            <TradeList 
              trades={trades.filter(t => t.status === 'Completed')}
              selectedTrade={displayTrade}
              onSelectTrade={handleTradeSelect}
              type="completed"
            />
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden md:block flex-1 h-full overflow-auto">
        {renderTradeDetail()}
      </div>
      {/* Mobile Trade Detail */}
      {displayTrade && (
        <div className="md:hidden">
          {renderTradeDetail()}
        </div>
      )}
    </div>
  );
}