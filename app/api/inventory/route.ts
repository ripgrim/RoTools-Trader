import { NextResponse } from "next/server";
import { headers } from "next/headers";

interface RolimonsItemDetails {
  name: string;
  acronym: string;
  rap: number;
  value: number;
  defaultValue: number;
  demand: number;
  trend: number;
  projected: number;
  hyped: number;
  rare: number;
}

interface ItemDetails {
  assetId: number;
  name: string;
  serial: number | null;
  rap: number;
  value: number;
  demand: number;
  trend: number;
  projected: boolean;
  hyped: boolean;
  rare: boolean;
  limited: number;
  acronym: string;
  thumbnailUrl?: string;
}

interface RolimonsInventoryResponse {
  success: boolean;
  playerTerminated: boolean;
  playerPrivacyEnabled: boolean;
  playerVerified: boolean;
  playerId: number;
  chartNominalScanTime: number;
  playerAssets: Record<string, number[]>;
  isOnline: boolean;
  presenceType: number;
  lastOnline: number;
  lastLocation: string;
  lastPlaceId: null | number;
  locationGameIsTracked: boolean;
  premium: boolean;
  badges: Record<string, number>;
  holds: any[];
}

interface ThumbnailResponse {
  data: {
    targetId: number;
    state: string;
    imageUrl: string;
    version: string;
  }[];
}

const DEMAND_LABELS = {
  "-1": "None",
  "0": "Terrible",
  "1": "Low",
  "2": "Normal",
  "3": "High",
  "4": "Amazing"
} as const;

const TREND_LABELS = {
  "-1": "None",
  "0": "Lowering",
  "1": "Unstable",
  "2": "Stable",
  "3": "Raising",
  "4": "Fluctuating"
} as const;

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    console.log(`[Inventory API] Fetching authenticated user`);
    
    // First, fetch the authenticated user's info
    const authUserResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Accept': 'application/json',
      },
    });

    if (!authUserResponse.ok) {
      const errorText = await authUserResponse.text();
      console.error(`[Inventory API] Error fetching authenticated user:`, errorText);
      return NextResponse.json(
        { error: `Failed to fetch authenticated user: ${authUserResponse.status}` },
        { status: authUserResponse.status }
      );
    }

    const authUserData = await authUserResponse.json();
    const userId = authUserData.id;
    
    console.log(`[Inventory API] Authenticated user ID: ${userId}`);
    
    // Now fetch inventory with the user ID
    const inventoryUrl = `https://api.rolimons.com/players/v1/playerassets/${userId}`;
    
    console.log(`[Inventory API] Fetching inventory for user ${userId}`);
    console.log(`[Inventory API] Request URL: ${inventoryUrl}`);
    
    // Fetch inventory data
    const inventoryResponse = await fetch(inventoryUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    console.log(`[Inventory API] Response status: ${inventoryResponse.status}`);

    if (!inventoryResponse.ok) {
      const errorText = await inventoryResponse.text();
      console.error(`[Inventory API] Error response:`, errorText);
      throw new Error(`Failed to fetch inventory: ${inventoryResponse.status} ${inventoryResponse.statusText}`);
    }

    const inventoryData = await inventoryResponse.json() as RolimonsInventoryResponse;
    console.log(`[Inventory API] Raw inventory data:`, JSON.stringify(inventoryData, null, 2));

    // Get the host from headers
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Fetch all items data
    console.log("[Inventory API] Fetching items data...");
    const itemsResponse = await fetch(`${baseUrl}/api/items`);
    if (!itemsResponse.ok) {
      throw new Error("Failed to fetch items data");
    }
    const itemsData = await itemsResponse.json();
    console.log(`[Inventory API] Successfully fetched items data with ${Object.keys(itemsData.items || {}).length} items`);
    
    // Transform and enrich inventory data
    const items = Object.entries(inventoryData.playerAssets || {}).map(([id, serials]: [string, number[]]) => {
      const itemDetails = itemsData.items?.[id] as string[];
      if (!itemDetails) {
        console.warn(`[Inventory API] No details found for item ${id}`);
        return null;
      }

      // Parse Rolimons item details array
      const parsedDetails: RolimonsItemDetails = {
        name: itemDetails[0],
        acronym: itemDetails[1],
        rap: parseInt(itemDetails[2]),
        value: parseInt(itemDetails[3]),
        defaultValue: parseInt(itemDetails[4]),
        demand: parseInt(itemDetails[5]),
        trend: parseInt(itemDetails[6]),
        projected: parseInt(itemDetails[7]),
        hyped: parseInt(itemDetails[8]),
        rare: parseInt(itemDetails[9])
      };

      // Get the first serial number if available
      const serial = serials && serials.length > 0 ? serials[0] : null;

      return {
        assetId: parseInt(id),
        name: parsedDetails.name,
        serial: serial,
        rap: parsedDetails.rap,
        value: parsedDetails.value,
        demand: parsedDetails.demand,
        trend: parsedDetails.trend,
        projected: parsedDetails.projected === 1,
        hyped: parsedDetails.hyped === 1,
        rare: parsedDetails.rare === 1,
        limited: serial ? 1 : 0, // Set limited to 1 if item has a serial number
        acronym: parsedDetails.acronym || ""
      };
    }).filter((item): item is ItemDetails => item !== null);

    // Fetch thumbnail URLs for all items
    console.log("[Inventory API] Fetching thumbnail URLs...");
    const assetIds = items.map(item => item.assetId);
    const thumbnailResponse = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(",")}&size=420x420&format=Png`
    );
    
    if (!thumbnailResponse.ok) {
      console.error("[Inventory API] Failed to fetch thumbnails:", await thumbnailResponse.text());
      // Continue without thumbnails rather than failing the whole request
    } else {
      const thumbnailData: ThumbnailResponse = await thumbnailResponse.json();
      const thumbnailUrls = thumbnailData.data.reduce((acc, item) => {
        acc[item.targetId] = item.imageUrl;
        return acc;
      }, {} as Record<number, string>);

      // Add thumbnail URLs to items
      items.forEach(item => {
        item.thumbnailUrl = thumbnailUrls[item.assetId];
      });
    }

    console.log(`[Inventory API] Transformed ${items.length} items with enriched data`);
    return NextResponse.json(items);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : {
      message: String(error)
    };
    
    console.error("[Inventory API] Detailed error:", errorDetails);
    return NextResponse.json(
      { error: "Failed to fetch inventory", details: errorDetails.message },
      { status: 500 }
    );
  }
} 