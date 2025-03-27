import { create } from 'zustand';
import { Trade } from '@/app/types/trade';

interface TradeStore {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  setTrades: (trades: Trade[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  trades: [],
  loading: false,
  error: null,
  setTrades: (trades) => set({ trades }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));