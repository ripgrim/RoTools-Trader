'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useRobloxAuthContext } from './roblox-auth-provider';

interface TradeActionsContextType {
  refreshInboundCount: () => void;
  registerRefreshFunction: (fn: () => Promise<number>) => void;
  acceptTrade: (tradeId: number | string) => Promise<void>;
  declineTrade: (tradeId: number | string) => Promise<void>;
  counterTrade: (tradeId: number | string) => Promise<void>;
  registerRefreshAllTradesFunction: (fn: () => Promise<void>) => void;
  removeTrade: (tradeId: number | string) => void;
  registerRemoveTradeFunction: (fn: (tradeId: number | string) => void) => void;
}

const TradeActionsContext = createContext<TradeActionsContextType | undefined>(undefined);

export function TradeActionsProvider({ children }: { children: React.ReactNode }) {
  const [refreshFn, setRefreshFn] = useState<(() => Promise<number>) | null>(null);
  const [refreshAllTradesFn, setRefreshAllTradesFn] = useState<(() => Promise<void>) | null>(null);
  const [removeTradeFunction, setRemoveTradeFunction] = useState<((tradeId: number | string) => void) | null>(null);
  const { cookie } = useRobloxAuthContext();
  
  const registerRefreshFunction = useCallback((fn: () => Promise<number>) => {
    setRefreshFn(() => fn);
  }, []);
  
  const registerRefreshAllTradesFunction = useCallback((fn: () => Promise<void>) => {
    setRefreshAllTradesFn(() => fn);
  }, []);
  
  const registerRemoveTradeFunction = useCallback((fn: (tradeId: number | string) => void) => {
    setRemoveTradeFunction(() => fn);
  }, []);
  
  const refreshInboundCount = useCallback(() => {
    if (refreshFn) {
      refreshFn().catch(err => {
        console.error("Error refreshing inbound count:", err);
      });
    } else {
      console.warn("No refresh function registered");
    }
  }, [refreshFn]);

  const refreshAllTrades = useCallback(() => {
    if (refreshAllTradesFn) {
      refreshAllTradesFn().catch(err => {
        console.error("Error refreshing all trades:", err);
      });
    } else {
      console.warn("No refresh all trades function registered");
    }
  }, [refreshAllTradesFn]);
  
  const removeTrade = useCallback((tradeId: number | string) => {
    if (removeTradeFunction) {
      removeTradeFunction(tradeId);
    } else {
      console.warn("No remove trade function registered");
    }
    
    // Also try to clear trade detail cache by calling clearCache on each detail
    try {
      // This would need more implementation to access the trade detail cache
      // Would require additional hooks or context
      console.log(`Trade detail cache for ID: ${tradeId} should also be cleared`);
    } catch (error) {
      console.error("Error clearing trade detail cache:", error);
    }
  }, [removeTradeFunction]);
  
  const acceptTrade = useCallback(async (tradeId: number | string) => {
    if (!cookie) {
      console.error("No cookie available for trade action");
      return;
    }
    
    try {
      console.log(`Attempting to accept trade ID: ${tradeId}`);
      
      const response = await fetch(`/api/roblox/trades/${tradeId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-roblox-cookie': cookie
        }
      });
      
      // Log response status for debugging
      console.log(`Accept trade response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Accept trade API error:`, {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to accept trade: ${response.status}`);
      }
      
      console.log(`Successfully accepted trade: ${tradeId}`);
      
      // Remove the trade from cache
      removeTrade(tradeId);
      
      // Refresh all trades to update the UI
      refreshAllTrades();
      // Also refresh the inbound count
      refreshInboundCount();
    } catch (error) {
      console.error("Error accepting trade:", error);
      throw error;
    }
  }, [cookie, refreshInboundCount, refreshAllTrades, removeTrade]);
  
  const declineTrade = useCallback(async (tradeId: number | string) => {
    if (!cookie) {
      console.error("No cookie available for trade action");
      return;
    }
    
    try {
      console.log(`Attempting to decline trade ID: ${tradeId}`);
      
      const response = await fetch(`/api/roblox/trades/${tradeId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-roblox-cookie': cookie
        }
      });
      
      // Log response status for debugging
      console.log(`Decline trade response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Decline trade API error:`, {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to decline trade: ${response.status}`);
      }
      
      console.log(`Successfully declined trade: ${tradeId}`);
      
      // Remove the trade from cache
      removeTrade(tradeId);
      
      // Refresh all trades to update the UI
      refreshAllTrades();
      // Also refresh the inbound count
      refreshInboundCount();
    } catch (error) {
      console.error("Error declining trade:", error);
      throw error;
    }
  }, [cookie, refreshInboundCount, refreshAllTrades, removeTrade]);

  const counterTrade = useCallback(async (tradeId: number | string) => {
    if (!cookie) {
      console.error("No cookie available for trade action");
      return;
    }
    
    try {
      // First, we need to get trade details to create a counter offer
      const detailsResponse = await fetch(`/api/roblox/trades/${tradeId}`, {
        headers: {
          'x-roblox-cookie': cookie
        }
      });
      
      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch trade details: ${detailsResponse.status}`);
      }
      
      // Fetch the trade details to verify it exists
      const tradeDetails = await detailsResponse.json();
      console.log(`Retrieved trade details for counter trade: ${tradeId}`);
      
      // Remove the trade from cache
      removeTrade(tradeId);
      
      // Refresh all trades before navigating
      refreshAllTrades();
      // Also refresh inbound count
      refreshInboundCount();
      
      // Navigate to counter trade page with the Next.js router for a smoother transition
      window.location.href = `/trades/${tradeId}/counter`;
      
    } catch (error) {
      console.error("Error creating counter trade:", error);
      throw error;
    }
  }, [cookie, refreshInboundCount, refreshAllTrades, removeTrade]);
  
  return (
    <TradeActionsContext.Provider value={{ 
      refreshInboundCount, 
      registerRefreshFunction,
      acceptTrade,
      declineTrade,
      counterTrade,
      registerRefreshAllTradesFunction,
      removeTrade,
      registerRemoveTradeFunction
    }}>
      {children}
    </TradeActionsContext.Provider>
  );
}

export function useTradeActions() {
  const context = useContext(TradeActionsContext);
  
  if (context === undefined) {
    throw new Error('useTradeActions must be used within a TradeActionsProvider');
  }
  
  return context;
}