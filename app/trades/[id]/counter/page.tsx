"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeftRight } from "lucide-react";

import { useRobloxAuthContext } from "@/app/providers/roblox-auth-provider";
import { Button } from "@/components/ui/button";
import { Trade, TradeItem } from "@/app/types/trade";
import { useToast } from "@/hooks/use-toast";
import { TradeItem as TradeItemComponent } from "@/components/trades/trade-item";

// Interface for the counter trade request
interface CounterTradeRequest {
  tradeId: string;
  offerItems: number[];
  requestItems: number[];
}

export default function CounterTradePage() {
  const params = useParams();
  const router = useRouter();
  const { cookie } = useRobloxAuthContext();
  const { toast } = useToast();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // We'll swap the items for the counter trade
  const [counterItems, setCounterItems] = useState<{
    offering: TradeItem[];
    requesting: TradeItem[];
  }>({
    offering: [],
    requesting: []
  });

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
        console.log("Received trade details for counter:", data);
        
        // Check if the data has the expected structure
        if (!data || !data.offers || !Array.isArray(data.offers)) {
          throw new Error("Invalid trade data structure");
        }
        
        // Transform the API data to our application's Trade format
        const otherUserOfferId = data.user.id;
        const otherUserOffer = data.offers.find((offer: any) => offer.user?.id === otherUserOfferId);
        const currentUserOffer = data.offers.find((offer: any) => offer.user?.id !== otherUserOfferId);
        
        if (!otherUserOffer || !currentUserOffer) {
          throw new Error("Could not identify user offers correctly");
        }
        
        // Transform user assets to our TradeItem format
        const mapUserAssets = (assets: any[]): TradeItem[] => {
          return assets.map(asset => ({
            id: asset.assetId,
            name: asset.asset?.name || "Unknown Item",
            assetType: asset.asset?.assetType?.name || "Item",
            thumbnail: asset.asset?.thumbnail || '',
            rap: asset.asset?.recentAveragePrice || 0,
            value: asset.asset?.recentAveragePrice || 0,
            serial: asset.serialNumber?.toString() || null
          }));
        };
        
        // Transform to our application's Trade format
        const transformedTrade: Trade = {
          id: data.id,
          user: {
            id: otherUserOfferId,
            name: data.user.name,
            displayName: data.user.displayName,
            avatar: `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Webp/noFilter`
          },
          status: 'Inbound',
          items: {
            // What the other user is offering to you
            offering: mapUserAssets(otherUserOffer.userAssets || []),
            // What you're giving in return
            requesting: mapUserAssets(currentUserOffer.userAssets || [])
          },
          created: data.created,
          expiration: data.expiration,
          isActive: data.isActive
        };
        
        setTrade(transformedTrade);
        
        // For counter trade, we typically swap what's being offered and requested
        setCounterItems({
          // What they offered to me becomes what I'm requesting
          requesting: transformedTrade.items.offering,
          // What they requested from me becomes what I'm offering
          offering: transformedTrade.items.requesting
        });
      } catch (error) {
        console.error("Error fetching trade details:", error);
        setError("Failed to fetch trade details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeDetails();
  }, [cookie, params.id]);
  
  const handleSubmitCounterTrade = async () => {
    if (!cookie || !trade) {
      toast({
        title: "Error",
        description: "Authentication required or trade data missing",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract item IDs for the counter trade
      const counterTradeData: CounterTradeRequest = {
        tradeId: String(params.id),
        offerItems: counterItems.offering.map(item => Number(item.id)),
        requestItems: counterItems.requesting.map(item => Number(item.id)),
      };

      // Send the counter trade request
      const response = await fetch(`/api/roblox/trades/counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-roblox-cookie': cookie
        },
        body: JSON.stringify(counterTradeData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to submit counter trade: ${errorData.message || response.status}`);
      }

      toast({
        title: "Success",
        description: "Counter trade submitted successfully",
      });

      // Redirect back to trades page
      router.push('/trades');
    } catch (error) {
      console.error("Error submitting counter trade:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit counter trade",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        You're creating a counter offer for trade from {trade.user.displayName} (@{trade.user.name})
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            You will offer:
          </h2>
          <div className="space-y-4 border border-zinc-800 p-4 bg-zinc-900/50 rounded-sm">
            {counterItems.offering.length > 0 ? (
              counterItems.offering.map((item) => (
                <TradeItemComponent key={`offering-${item.id}`} item={item} />
              ))
            ) : (
              <p className="text-zinc-400">No items selected</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            You will receive:
          </h2>
          <div className="space-y-4 border border-zinc-800 p-4 bg-zinc-900/50 rounded-sm">
            {counterItems.requesting.length > 0 ? (
              counterItems.requesting.map((item) => (
                <TradeItemComponent key={`requesting-${item.id}`} item={item} />
              ))
            ) : (
              <p className="text-zinc-400">No items selected</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-4 justify-end">
        <Button 
          onClick={() => router.push('/trades')}
          variant="outline"
          className="border-zinc-800"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmitCounterTrade}
          className="gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4" />
              Send Counter Trade
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 