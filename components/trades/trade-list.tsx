"use client"

import { Trade } from '@/app/types/trade';
import { TradeCard } from './trade-card';
import { motion } from 'framer-motion';

interface TradeListProps {
  trades: Trade[];
  selectedTrade: Trade | null;
  onSelectTrade: (trade: Trade) => void;
  type?: 'inbound' | 'outbound' | 'completed';
}

export function TradeList({ trades, selectedTrade, onSelectTrade, type }: TradeListProps) {
  const emptyStateMessages = {
    inbound: {
      title: "No Inbound Trades",
      description: "No one is currently offering trades to you"
    },
    outbound: {
      title: "No Outbound Trades",
      description: "You haven't sent any trade requests"
    },
    completed: {
      title: "No Completed Trades",
      description: "Your completed trades will appear here"
    }
  };

  if (trades.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 border border-border mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-muted-foreground text-lg font-medium">
          {type === 'inbound' && emptyStateMessages.inbound.title}
          {type === 'outbound' && emptyStateMessages.outbound.title}
          {type === 'completed' && emptyStateMessages.completed.title}
          {!type && 'No trades found'}
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          {type === 'inbound' && emptyStateMessages.inbound.description}
          {type === 'outbound' && emptyStateMessages.outbound.description}
          {type === 'completed' && emptyStateMessages.completed.description}
          {!type && 'No trades found'}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-1"
    >
      {trades.map((trade, index) => (
        <motion.div
          key={trade.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectTrade(trade)}
          className={`cursor-pointer transition-colors duration-200 ${
            selectedTrade?.id === trade.id 
              ? 'bg-secondary/50 border border-border' 
              : 'hover:bg-secondary/30'
          }`}
        >
          <TradeCard trade={trade} />
        </motion.div>
      ))}
    </motion.div>
  );
}