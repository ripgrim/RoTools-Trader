"use server";

import { Trade, TradeDetail, TradeOffer } from "@/app/types/trade";
import { verifyAuthToken } from "../user";
import { getBatchThumbnails } from "../thumbnails";

export async function getDetailedTrade(token: string, tradeId: string) {
  const response = await fetch(
    `https://trades.roblox.com/v1/trades/${tradeId}`,
    {
      headers: {
        Cookie: `.ROBLOSECURITY=${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `failed to fetch trades (${response.status}): ${await response.text()}`
    );
  }

  return (await response.json()) as TradeDetail;
}

export async function listRobloxTrades(
  token: string,
  tradeType: "outbound" | "inbound" | "completed" | "inactive"
): Promise<Trade[]> {
  const authUser = await verifyAuthToken(token);
  const response = await fetch(
    `https://trades.roblox.com/v1/trades/${tradeType}?limit=25&sortOrder=Desc`,
    {
      headers: {
        Cookie: `.ROBLOSECURITY=${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `failed to fetch trades (${response.status}): ${await response.text()}`
    );
  }

  const data = await response.json();
  const trades: TradeDetail[] = await Promise.all(
    data.data.map(async (trade: any) => {
      return await getDetailedTrade(token, String(trade.id));
    })
  );

  const thumbnails = await getBatchThumbnails(
    trades.flatMap((trade) =>
      trade.offers.flatMap((offer) =>
        offer.userAssets.map((asset) => ({
          type: "Asset",
          size: "200x200",
          format: "webp",
          id: asset.assetId,
        }))
      )
    )
  );

  data.data = data.data
    .filter((a: any) => {
      return trades.find((b) => a.id === b.id) !== undefined;
    })
    .map((a: any) => {
      const trade = trades.find((b) => a.id === b.id)!;
      return { ...a, offers: trade.offers };
    });

  return data.data.map((trade: Trade) => ({
    id: trade.id,
    user: {
      id: trade.user.id,
      name: trade.user.name,
      displayName: trade.user.displayName,
    },
    status: trade.status,
    items: {
      offering: trade
        .offers!.filter((offer: TradeOffer) => {
          return String(offer.user.id) !== String(authUser.user.id);
        })
        .map((item) => ({
          id: item.userAssets[0].assetId,
          name: item.userAssets[0].name,
          assetType: "Asset",
          thumbnail: thumbnails[String(item.userAssets[0].id)],
        })),
        requesting: trade
        .offers!.filter((offer: TradeOffer) => {
          return String(offer.user.id) === String(authUser.user.id);
        })
        .map((item) => ({
          id: item.userAssets[0].assetId,
          name: item.userAssets[0].name,
          assetType: "Asset",
          thumbnail: thumbnails[String(item.userAssets[0].id)],
        })),
    },
    created: trade.created,
  }));
}
