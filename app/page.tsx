"use client";

import { Trades } from '@/components/trades/trades';
import { TradesSkeleton } from '@/components/skeletons/trades';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';
import { RobloxAuthDialog } from '@/components/auth/roblox-auth-dialog';
import { useTrades } from '@/app/hooks/use-trades';
import { useState } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useRobloxAuthContext();
  const { trades, isLoading: tradesLoading, error } = useTrades();
  const [isDialogOpen, setIsDialogOpen] = useState(!isAuthenticated && !authLoading);

  // Show loading state while auth is being determined or trades are loading
  if (authLoading || (isAuthenticated && tradesLoading)) {
    return (
      <main className="min-h-screen bg-background">
        <div className="h-screen">
          <TradesSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="h-screen">
        {isAuthenticated ? <Trades trades={trades} /> : <TradesSkeleton />}
        <RobloxAuthDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
        />
      </div>
    </main>
  );
}