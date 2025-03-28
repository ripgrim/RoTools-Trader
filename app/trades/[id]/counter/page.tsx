"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useRobloxAuthContext } from "@/app/providers/roblox-auth-provider";
import { Button } from "@/components/ui/button";
import { Trade } from "@/app/types/trade";

export default function CounterTradePage() {
  const params = useParams();
  const router = useRouter();
  const { cookie } = useRobloxAuthContext();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTradeDetails = async () => {
      if (!cookie) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/roblox/trades/${params.id}`, {
          headers: {
            'x-roblox-cookie': cookie
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch trade details: ${response.status}`);
        }

        const data = await response.json();
        setTrade(data);
      } catch (error) {
        console.error("Error fetching trade details:", error);
        setError("Failed to fetch trade details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeDetails();
  }, [cookie, params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-zinc-400">Loading trade details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <p className="text-red-500">{error}</p>
        <Button 
          onClick={() => router.push('/trades')}
          className="mt-4"
        >
          Return to Trades
        </Button>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <p className="text-zinc-400">No trade details found.</p>
        <Button 
          onClick={() => router.push('/trades')}
          className="mt-4"
        >
          Return to Trades
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Counter Trade</h1>
      <p className="mb-8 text-zinc-400">
        Creating a counter offer for trade #{params.id}. This feature is coming soon.
      </p>
      <div className="flex space-x-4">
        <Button 
          onClick={() => router.push(`/trades/${params.id}`)}
          variant="outline"
        >
          Back to Trade
        </Button>
        <Button 
          onClick={() => router.push('/trades')}
        >
          All Trades
        </Button>
      </div>
    </div>
  );
} 