import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Trade, TradeItem } from "@/app/types/trade";
import { ScreenshotTrade } from "@/components/trades/trade-screenshot";
import { avatarCache } from "@/app/hooks/use-avatar-thumbnail";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas as thousands separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-US');
}

export function transformTradeForScreenshot(trade: Trade): ScreenshotTrade {
  // Function to get preferred value (similar to trade-detail.tsx)
  const getPreferredValue = (item: TradeItem): number => {
    const value = typeof item.value === 'number' ? item.value : null;
    const hasValidValue = value !== null && value !== -1;
    const rap = typeof item.rap === 'number' ? item.rap : 0;
    
    // Return value if it exists and is valid, otherwise fallback to RAP
    return hasValidValue ? value : rap;
  };

  // Calculate total values using preferred value logic
  const sendingValue = trade.items.requesting.reduce((sum, item) => 
    sum + getPreferredValue(item), 0
  );
  const receivingValue = trade.items.offering.reduce((sum, item) => 
    sum + getPreferredValue(item), 0
  );
  const valueDiff = receivingValue - sendingValue;
  const valueDiffPercentage = Math.round(sendingValue === 0 ? 0 : (valueDiff / sendingValue) * 100);

  // Transform items to match the screenshot format
  const transformItem = (item: TradeItem) => ({
    id: item.id.toString(),
    name: item.name,
    thumbnail: item.thumbnail,
    ...(item.serial ? { serial: item.serial } : {}),
    ...(typeof item.rap === 'number' ? { rap: item.rap } : {}),
    ...(typeof item.value === 'number' ? { value: item.value } : {}),
  });

  // Create a unique avatar for the receiver (current user) using a data URL
  // This is a specially styled SVG avatar that's distinct from the default placeholder
  const receiverAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%231A1A2E'/%3E%3Ccircle cx='75' cy='55' r='25' fill='%23FAFAFA'/%3E%3Crect x='40' y='85' width='70' height='45' rx='10' fill='%23FAFAFA'/%3E%3Ccircle cx='55' cy='50' r='5' fill='%231A1A2E'/%3E%3Ccircle cx='95' cy='50' r='5' fill='%231A1A2E'/%3E%3Cpath d='M60,65 Q75,80 90,65' stroke='%231A1A2E' stroke-width='3' fill='none'/%3E%3C/svg%3E";

  return {
    id: trade.id.toString(),
    created: trade.created,
    sender: {
      displayName: trade.user.displayName,
      avatar: trade.user.avatar,
    },
    receiver: {
      displayName: "You",
      avatar: receiverAvatar, // Use a distinct avatar for the current user
    },
    sending: trade.items.requesting.map(transformItem),
    receiving: trade.items.offering.map(transformItem),
    sendingValue,
    receivingValue,
    valueDiff,
    valueDiffPercentage,
    type: 'Trade' as const,
  };
}

// Transform a Roblox API trade detail response to our application's Trade format
export function transformTradeForDetail(tradeData: any): Trade {
  try {
    if (!tradeData || !tradeData.offers || !Array.isArray(tradeData.offers)) {
      throw new Error("Invalid trade data structure");
    }

    // Determine which offer is the current user's and which is the other user's
    // Note: This logic should be adapted based on your application needs
    // In the sample data, the user.id in the main trade data is the trade sender/counterparty
    const otherUserOfferId = tradeData.user.id;
    
    const otherUserOffer = tradeData.offers.find((offer: any) => offer.user.id === otherUserOfferId);
    const currentUserOffer = tradeData.offers.find((offer: any) => offer.user.id !== otherUserOfferId);
    
    if (!otherUserOffer || !currentUserOffer) {
      throw new Error("Could not identify user offers correctly");
    }

    // Transform user assets to our TradeItem format
    const mapUserAssets = (assets: any[]): TradeItem[] => {
      return assets.map(asset => {
        // Get asset type for proper placeholder
        const assetType = asset.assetType?.name || "Item";
        
        return {
          id: asset.assetId,
          name: asset.name || "Unknown Item",
          assetType: assetType,
          assetTypeId: asset.assetType?.id || 0,
          // Use a placeholder that matches Roblox's URL format
          thumbnail: `https://tr.rbxcdn.com/30DAY-placeholder/150/150/${assetType}/Png/noFilter`,
          rap: asset.recentAveragePrice || 0,
          value: asset.recentAveragePrice || 0, // Assuming RAP equals value if not specified
          serial: asset.serialNumber?.toString() || null
        };
      });
    };

    // Map trade status
    let status: 'Inbound' | 'Outbound' | 'Completed' | 'Declined' | 'Open';
    
    // In a real implementation, you'd determine this based on the user's relationship to the trade
    // For this example, assuming it's an inbound trade
    status = 'Inbound';
    
    if (tradeData.status === 'Completed') {
      status = 'Completed';
    } else if (tradeData.status === 'Declined' || tradeData.status === 'Rejected') {
      status = 'Declined';
    }

    // Check if we have the user's avatar in the cache
    const userId = otherUserOffer.user.id;
    const cachedAvatar = avatarCache.get(userId);
    const defaultAvatar = `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter`;

    // Create the transformed trade object
    return {
      id: tradeData.id,
      user: {
        id: otherUserOffer.user.id,
        name: otherUserOffer.user.name,
        displayName: otherUserOffer.user.displayName,
        // Use cached avatar if available, otherwise use placeholder
        avatar: cachedAvatar || defaultAvatar
      },
      status,
      items: {
        // What the other user is offering to you
        offering: mapUserAssets(otherUserOffer.userAssets || []),
        // What you're giving in return
        requesting: mapUserAssets(currentUserOffer.userAssets || [])
      },
      created: tradeData.created,
      expiration: tradeData.expiration,
      isActive: tradeData.isActive
    };
  } catch (error) {
    console.error("Error transforming trade detail data:", error);
    
    // Return a placeholder trade object on error
    return {
      id: tradeData?.id || 0,
      user: {
        id: 0,
        name: "Error",
        displayName: "Error Processing Trade",
        avatar: `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Webp/noFilter`
      },
      status: 'Declined',
      items: { offering: [], requesting: [] },
      created: tradeData?.created || new Date().toISOString(),
      expiration: tradeData?.expiration || new Date().toISOString(),
      isActive: false
    };
  }
}
