"use client"

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeList } from './trade-list';
import { Trade } from '@/app/types/trade';
import { TradeDetail } from './trade-detail';
import { useTradeDetails } from '@/app/hooks/use-trade-details';
import { TradeSkeleton } from './trade-skeleton';
import { TradeItemSkeleton } from './trade-item-skeleton';
import { PackageOpen, ShoppingBag, ArrowDownLeft, ArrowUpRight, CheckSquare, RefreshCw } from 'lucide-react';
import { useTrades } from '@/app/hooks/use-trades';
import { useTradeActions } from '@/app/providers/trade-actions-provider';
import { Button } from '../ui/button';

// Empty state component for when there are no trades
function EmptyTradeDetail({ type }: { type: string }) {
  // Different messages based on trade type
  const messages = {
    inbound: {
      title: "No Inbound Trades",
      description: "You don't have any incoming trade requests at the moment.",
    },
    outbound: {
      title: "No Outbound Trades",
      description: "You haven't sent any trade requests yet.",
    },
    completed: {
      title: "No Completed Trades",
      description: "Your trade history will appear here when you complete trades.",
    },
    default: {
      title: "No Trades",
      description: "There are no trades to display right now.",
    }
  };

  const content = messages[type as keyof typeof messages] || messages.default;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 relative w-40 h-40 flex items-center justify-center">
        <img
          src="https://images.rbxcdn.com/9281912c23312bc0d08ab750afa588cc.png"
          alt="Roblox 404 Character"
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-xs text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded-md">
            Roblox's 404 Noob
          </span>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-zinc-300 mb-2">{content.title}</h3>
      <p className="text-zinc-500 mb-6 max-w-xs">{content.description}</p>
    </div>
  );
}

export function Trades({ trades }: { trades?: Trade[] }) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('inbound');

  // Fetch detailed trade information for the selected trade
  const { trade: detailedTrade, isLoading: isTradeLoading, error: tradeError } = useTradeDetails(selectedTradeId);

  // We'll use either the detailed trade (if loaded) or the original list item
  const [displayTrade, setDisplayTrade] = useState<Trade | null>(null);

  // Get trades hooks for pagination
  const {
    displayedTrades,
    loadMoreTrades,
    hasMoreTrades,
    isLoadingMore,
    inboundCount,
    isCountLoading,
    refreshInboundCount,
    refetch: refreshAllTrades
  } = useTrades();

  // State for refresh button loading
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refreshing all trades
  const handleRefreshTrades = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllTrades();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Register the refresh functions with the global TradeActions context
  const { 
    registerRefreshFunction, 
    registerRefreshAllTradesFunction,
    registerRemoveTradeFunction
  } = useTradeActions();

  // Register all the callback functions
  useEffect(() => {
    registerRefreshFunction(refreshInboundCount);
    registerRefreshAllTradesFunction(refreshAllTrades);
    registerRemoveTradeFunction((tradeId) => {
      // When a trade is removed, we need to:
      // If the removed trade was selected, clear the selection
      if (selectedTradeId === tradeId) {
        setSelectedTradeId(null);
        setDisplayTrade(null);
        setIsDrawerOpen(false);
      }
      
      console.log(`Removed trade ID: ${tradeId} from displayed trades`);
    });
  }, [
    registerRefreshFunction, 
    refreshInboundCount, 
    registerRefreshAllTradesFunction, 
    refreshAllTrades,
    registerRemoveTradeFunction,
    selectedTradeId
  ]);

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

  // Auto-select first trade on desktop or when tab changes
  useEffect(() => {
    const currentTabTrades = getCurrentTabTrades();

    if (currentTabTrades.length > 0) {
      const firstTrade = currentTabTrades[0];
      console.log(`Auto-selecting first ${activeTab} trade:`, {
        id: firstTrade.id,
        user: firstTrade.user.name
      });

      // Select the first trade of the current tab
      setSelectedTradeId(firstTrade.id);
      setDisplayTrade(firstTrade);

      // On desktop, no need to show drawer as details are always visible
      if (!isMobile) {
        setIsDrawerOpen(false);
      }
    } else {
      // No trades in this tab, clear selection
      setSelectedTradeId(null);
      setDisplayTrade(null);
      setIsDrawerOpen(false);
    }
  }, [activeTab, isMobile, displayedTrades]);

  // Update the display trade when detailed trade data is loaded
  useEffect(() => {
    if (detailedTrade) {
      // If we have a detailed trade, use it
      setDisplayTrade(detailedTrade);
    } else if (selectedTradeId && !isTradeLoading) {
      // If loading failed or there's an error, fall back to the list item
      const allTrades = [
        ...displayedTrades.inbound,
        ...displayedTrades.outbound,
        ...displayedTrades.completed
      ];
      const fallbackTrade = allTrades.find(t => t.id === selectedTradeId);
      if (fallbackTrade) setDisplayTrade(fallbackTrade);
    }
  }, [detailedTrade, isTradeLoading, selectedTradeId, displayedTrades]);

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
    console.log(`Switching to tab: ${value}`);
    setActiveTab(value);

    // Refresh inbound count when switching tabs
    if (value === 'inbound') {
      refreshInboundCount();
    }

    // Don't clear selection here, let the effect handle it
  };

  const handleLoadMore = () => {
    // Load more trades based on the active tab
    if (activeTab === 'inbound') {
      loadMoreTrades('inbound');
    } else if (activeTab === 'outbound') {
      loadMoreTrades('outbound');
    } else if (activeTab === 'completed') {
      loadMoreTrades('completed');
    }
  };

  // Check if current tab has more trades to load
  const canLoadMore = () => {
    if (activeTab === 'inbound') return hasMoreTrades('inbound');
    if (activeTab === 'outbound') return hasMoreTrades('outbound');
    if (activeTab === 'completed') return hasMoreTrades('completed');
    return false;
  };

  // Get current tab's trades
  const getCurrentTabTrades = () => {
    // Now use the displayedTrades from the hook
    if (activeTab === 'inbound') return displayedTrades.inbound;
    if (activeTab === 'outbound') return displayedTrades.outbound;
    if (activeTab === 'completed') return displayedTrades.completed;
    return [];
  };

  // Render the trade details or a loading state
  const renderTradeDetail = () => {
    const currentTabTrades = getCurrentTabTrades();

    // Check if there are no trades in the current tab
    if (currentTabTrades.length === 0) {
      return <EmptyTradeDetail type={activeTab} />;
    }

    // No selected trade
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
          <TabsList className="justify-between px-6 py-6 bg-transparent border-b border-zinc-800">
            <div className="flex">
              <TabsTrigger value="inbound" className="data-[state=active]:bg-background group relative">
                Inbound
                {inboundCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black font-medium">
                    {inboundCount > 99 ? '99+' : inboundCount}
                  </span>
                )}
                {isCountLoading && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-none bg-zinc-700 text-xs text-zinc-300 animate-pulse">
                    •••
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="outbound" className="data-[state=active]:bg-background">
                Outbound
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-background">
                Completed
              </TabsTrigger>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 border-zinc-800 text-zinc-400"
              onClick={handleRefreshTrades}
              disabled={isRefreshing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </TabsList>
          <TabsContent value="inbound" className="flex-1 px-6 py-4">
            <div className="space-y-4">
              <TradeList
                trades={displayedTrades.inbound}
                selectedTrade={displayTrade}
                onSelectTrade={handleTradeSelect}
                type="inbound"
              />

              {canLoadMore() && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium text-zinc-300 bg-background border border-zinc-700 hover:bg-zinc-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="outbound" className="flex-1 px-6 py-4">
            <div className="space-y-4">
              <TradeList
                trades={displayedTrades.outbound}
                selectedTrade={displayTrade}
                onSelectTrade={handleTradeSelect}
                type="outbound"
              />

              {canLoadMore() && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium text-zinc-300 bg-background border border-zinc-700 hover:bg-zinc-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="flex-1 px-6 py-4">
            <div className="space-y-4">
              <TradeList
                trades={displayedTrades.completed}
                selectedTrade={displayTrade}
                onSelectTrade={handleTradeSelect}
                type="completed"
              />

              {canLoadMore() && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium text-zinc-300 bg-background border border-zinc-700 hover:bg-zinc-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden md:block flex-1 h-full overflow-auto">
        {renderTradeDetail()}
      </div>
      {/* Mobile Trade Detail */}
      {displayTrade && (
        <div className="md:hidden">
          {/* Mobile refresh button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground"
              onClick={handleRefreshTrades}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {renderTradeDetail()}
        </div>
      )}
    </div>
  );
}