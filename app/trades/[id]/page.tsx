import { TradeDetail } from '@/components/trades/trade-detail';
import { mockTrades } from '@/app/mocks/trades';

export default function TradePage({ params }: { params: { id: string } }) {
  const trade = mockTrades.find(t => t.id.toString() === params.id);
  
  if (!trade) {
    return <div>Trade not found</div>;
  }

  return <TradeDetail trade={trade} />;
} 