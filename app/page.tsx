"use client";

import { Trades } from '@/components/trades/trades';
import { useToken } from '@/providers/token-provider';
import { TradesSkeleton } from '@/components/skeletons/trades';
import { TokenDialog } from '@/components/token-dialog';

export default function Home() {
  const { user, isLoading } = useToken();

  if (isLoading) {
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
        {user ? <Trades/> : <TradesSkeleton />}
        <TokenDialog open={!user} />
      </div>
    </main>
  );
}