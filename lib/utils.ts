import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Trade, TradeItem } from "@/app/types/trade";
import { ScreenshotTrade } from "@/components/trades/trade-screenshot";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function transformTradeForScreenshot(trade: Trade): ScreenshotTrade {
  // Calculate total values
  const sendingValue = trade.items.requesting.reduce((sum, item) => 
    sum + (typeof item.value === 'number' ? item.value : 0), 0
  );
  const receivingValue = trade.items.offering.reduce((sum, item) => 
    sum + (typeof item.value === 'number' ? item.value : 0), 0
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

  return {
    id: trade.id.toString(),
    created: trade.created,
    sender: {
      displayName: trade.user.displayName,
      avatar: trade.user.avatar,
    },
    receiver: {
      displayName: "You",
      avatar: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
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
