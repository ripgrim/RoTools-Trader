"use server";

import { Trade, TradeDetail, TradeOffer } from "@/app/types/trade";
import { verifyAuthToken } from "../user";
import { getBatchThumbnails } from "../thumbnails";
import { getResaleData, getRolimonsItemDetails } from "../items";

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
    [...trades.flatMap((trade) =>
      trade.offers.flatMap((offer) =>
        offer.userAssets.map((asset): Parameters<typeof getBatchThumbnails>[0][0] => ({
          type: "Asset",
          size: "150x150",
          format: "webp",
          id: asset.assetId,
        }))
      )
    ), ...trades.flatMap((trade) =>
      trade.offers.flatMap((offer): Parameters<typeof getBatchThumbnails>[0][0] => ({
          type: "AvatarHeadShot",
          size: "100x100",
          format: "webp",
          id: offer.user.id,
      }))
    )]
  );

  const uniqueAssetIds = Array.from(new Set(trades.flatMap((trade) =>
    trade.offers.flatMap((offer) =>
      offer.userAssets.map((asset) => asset.assetId)
    )
  )));

  const resaleData: {id: string, data: ResaleData}[] = await Promise.all(uniqueAssetIds.map(async (id) => {
    return {id:String(id), data: await getResaleData(id)}
  }))

  data.data = data.data
    .filter((a: any) => {
      return trades.find((b) => a.id === b.id) !== undefined;
    })
    .map((a: any) => {
      const trade = trades.find((b) => a.id === b.id)!;
      return { ...a, offers: trade.offers };
    });

  const itemDetails = await getRolimonsItemDetails()

  return data.data.map((trade: Trade) => ({
    id: trade.id,
    user: {
      id: trade.user.id,
      name: trade.user.name,
      displayName: trade.user.displayName,
      avatar: thumbnails && thumbnails[String(trade.user.id)]
    },
    status: trade.status,
    items: {
      offering: trade
        .offers!.filter((offer: TradeOffer) => {
          return String(offer.user.id) !== String(authUser.user.id);
        })
        .flatMap((item) => item.userAssets.map(asset => ({
          id: asset.assetId,
          name: asset.name,
          assetType: "Asset",
          thumbnail: thumbnails[String(asset.assetId)],
          rap: resaleData.find((a) => a.id === String(asset.assetId))?.data?.recentAveragePrice || -1,
          value: itemDetails.items[String(asset.assetId)]?.[4] || -1
        }))),
      requesting: trade
        .offers!.filter((offer: TradeOffer) => {
          return String(offer.user.id) === String(authUser.user.id);
        })
        .flatMap((item) => item.userAssets.map(asset => ({
          id: asset.assetId,
          name: asset.name,
          assetType: "Asset",
          thumbnail: thumbnails[String(asset.assetId)],
          rap: resaleData.find((a) => a.id === String(asset.assetId))?.data?.recentAveragePrice || -1,
          value: itemDetails.items[String(asset.assetId)]?.[4] || -1
        }))),
    },
    created: trade.created,
  }));
}
