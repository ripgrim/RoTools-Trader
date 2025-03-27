"use client";

import { Trades } from '@/components/trades/trades';
import { mockTrades } from '@/app/mocks/trades';
import { useToken } from '@/providers/token-provider';
import { TradesSkeleton } from '@/components/skeletons/trades';
import { TokenDialog } from '@/components/token-dialog';

export default function Home() {
  const { hasToken, isLoading } = useToken();

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
        {hasToken ? <Trades trades={mockTrades} /> : <TradesSkeleton />}
        <TokenDialog open={!hasToken} />
      </div>
    </main>
  );
}