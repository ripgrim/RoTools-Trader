"use server"
import { getBatchThumbnails } from "../thumbnails";

const DEMAND_LABELS = {
  "-1": "None",
  "0": "Terrible",
  "1": "Low",
  "2": "Normal",
  "3": "High",
  "4": "Amazing",
} as const;

const TREND_LABELS = {
  "-1": "None",
  "0": "Lowering",
  "1": "Unstable",
  "2": "Stable",
  "3": "Raising",
  "4": "Fluctuating",
} as const;

export async function getRolimonsItemDetails() {
  const detailsResponse = await fetch(
    `https://api.rolimons.com/items/v2/itemdetails`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!detailsResponse.ok) {
    throw new Error(
      `failed to get rolimons item details (${
        detailsResponse.status
      }): ${await detailsResponse.text()}`
    );
  }

  return await detailsResponse.json();
}

export async function getRolimonsInventory(userId: string) {
  const inventoryResponse = await fetch(
    `https://api.rolimons.com/players/v1/playerassets/${userId}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!inventoryResponse.ok) {
    throw new Error(
      `failed to get rolimons inventory for ${userId} (${
        inventoryResponse.status
      }): ${await inventoryResponse.text()}`
    );
  }

  const inventoryData = (await inventoryResponse.json()).playerAssets as Record<string, number[]>;
  const itemDetails = (await getRolimonsItemDetails()).items as Record<
    string,
    [
      string,
      string,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number
    ]
  >;

  const items = Object.entries(inventoryData).filter((data) => {
    if (itemDetails[data[0]] === undefined) {
        return false
    }
    return true
  }).map((data) => {
    const details = itemDetails[data[0]]
    const id = data[0]
    const serials = data[1]
    return {
        assetId: parseInt(id),
        name: details[0],
        serial: serials[0] !== undefined ? serials[0] : null,
        rap: details[2],
        value: details[3],
        demand: details[5],
        trend: details[6],
        projected: details[7] === 1,
        hyped: details[8] === 1,
        rare: details[9] === 1,
        limited: serials.length > 0 ? 1 : 0,
        acronym: details[1] || "",
    }
  })

  const thumbnails = await getBatchThumbnails(items.map((item) => {
    return {id: item.assetId, type: "Asset", size: "420x420", format: "webp"}
  }))

  return items.map((asset) => {
    return {...asset, thumbnailUrl: thumbnails[String(asset.assetId)]}
  })
}
