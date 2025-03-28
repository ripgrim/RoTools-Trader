"use client"

import { TradeDetail } from '@/components/trades/trade-detail';
import { useTradeDetails } from '@/app/hooks/use-trade-details';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { TradeSkeleton } from '@/components/trades/trade-skeleton';
import { useState } from 'react';

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function TradePage({ params }: { params: { id: string } }) {
  const { trade, isLoading, error } = useTradeDetails(params.id);
  const [isOpen, setIsOpen] = useState(true);
  
  // Show loading state
  if (isLoading) {
    return <TradeSkeleton />;
  }
  
  // Show error state
  if (error || !trade) {
    return <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || "Trade not found"}
        </AlertDescription>
      </Alert>
    </div>;
  }

  return <TradeDetail 
    trade={trade} 
    isOpen={isOpen}
    onClose={setIsOpen}
  />;
} 