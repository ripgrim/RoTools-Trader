"use client"

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useRobloxAuthContext } from './roblox-auth-provider';

interface TradeActionsContextType {
  refreshInboundCount: () => void;
  registerRefreshFunction: (fn: () => Promise<number>) => void;
  acceptTrade: (tradeId: number | string) => Promise<void>;
  declineTrade: (tradeId: number | string) => Promise<void>;
  counterTrade: (tradeId: number | string) => Promise<void>;
}

const TradeActionsContext = createContext<TradeActionsContextType | undefined>(undefined);

export function TradeActionsProvider({ children }: { children: React.ReactNode }) {
  const [refreshFn, setRefreshFn] = useState<(() => Promise<number>) | null>(null);
  const { cookie } = useRobloxAuthContext();
  
  const registerRefreshFunction = useCallback((fn: () => Promise<number>) => {
    setRefreshFn(() => fn);
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
      
      // Refresh inbound count after action
      refreshInboundCount();
    } catch (error) {
      console.error("Error accepting trade:", error);
      throw error;
    }
  }, [cookie, refreshInboundCount]);
  
  const declineTrade = useCallback(async (tradeId: number | string) => {
    if (!cookie) {
      console.error("No cookie available for trade action");
      return;
    }
    
    try {
      console.log(`Attempting to decline trade ID: ${tradeId}`);
      
      // Cookie should be the full cookie string, not just the value
      // Format doesn't need to be modified here as API route will handle it
      
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
      
      // Refresh inbound count after action
      refreshInboundCount();
    } catch (error) {
      console.error("Error declining trade:", error);
      throw error;
    }
  }, [cookie, refreshInboundCount]);

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
      
      // For now, we just navigate to the trade page where the user can create a counter offer
      // In a full implementation, we'd handle the counter offer creation via an API
      window.location.href = `/trades/${tradeId}/counter`;
      
    } catch (error) {
      console.error("Error creating counter trade:", error);
      throw error;
    }
  }, [cookie]);
  
  return (
    <TradeActionsContext.Provider value={{ 
      refreshInboundCount, 
      registerRefreshFunction,
      acceptTrade,
      declineTrade,
      counterTrade
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