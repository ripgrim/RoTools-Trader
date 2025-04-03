"use client"

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeList } from './trade-list';
import { Trade } from '@/app/types/trade';
import { TradeDetail } from './trade-detail';
import { TradesSkeleton } from '../skeletons/trades';
import { useToken } from '@/providers/token-provider';
import { listRobloxTrades } from '@/api/trades';

export function Trades() {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('inbound');
  const {user, token} = useToken()
  const [trades, setTrades] = useState<Trade[]>([])

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
    if (!isMobile && trades && trades.length > 0 && !selectedTrade) {
      setSelectedTrade(trades[0]);
      setIsDrawerOpen(false);
    }
  }, [trades, isMobile, selectedTrade]);

  const handleTradeSelect = (trade: Trade) => {
    console.log('Selected Trade:', {
      id: trade.id,
      user: trade.user,
      status: trade.status,
      items: {
        offering: trade.items.offering.map(item => ({
          name: item.name,
          rap: item.rap,
          value: item.value,
          serial: item.serial
        })),
        requesting: trade.items.requesting.map(item => ({
          name: item.name,
          rap: item.rap,
          value: item.value,
          serial: item.serial
        }))
      },
      created: trade.created,
      expiration: trade.expiration,
      isActive: trade.isActive
    });
    setSelectedTrade(trade);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedTrade(null);
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    setTrades([])
    if (user && token) {
      listRobloxTrades(token, activeTab as "outbound").then(setTrades)
    }
  }, [activeTab, user, token])

  if (!trades) {
    return <TradesSkeleton/>
  }

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
              selectedTrade={selectedTrade}
              onSelectTrade={handleTradeSelect}
            />
          </TabsContent>
          <TabsContent value="outbound" className="flex-1 px-6 py-4">
            <TradeList 
              trades={trades.filter(t => t.status === 'Outbound')}
              selectedTrade={selectedTrade}
              onSelectTrade={handleTradeSelect}
            />
          </TabsContent>
          <TabsContent value="completed" className="flex-1 px-6 py-4">
            <TradeList 
              trades={trades.filter(t => t.status === 'Completed')}
              selectedTrade={selectedTrade}
              onSelectTrade={handleTradeSelect}
            />
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden md:block flex-1 h-full overflow-auto">
        {selectedTrade && (
          <TradeDetail 
            trade={selectedTrade} 
            isOpen={!isMobile}
            onClose={handleDrawerClose}
          />
        )}
      </div>
      {/* Mobile Trade Detail */}
      {selectedTrade && (
        <div className="md:hidden">
          <TradeDetail 
            trade={selectedTrade} 
            isOpen={isDrawerOpen}
            onClose={handleDrawerClose}
          />
        </div>
      )}
    </div>
  );
}