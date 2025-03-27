import { NextResponse } from "next/server";

// Cache the items data in memory
let itemsCache: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (itemsCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log("[Items API] Returning cached data");
      return NextResponse.json(itemsCache);
    }

    const url = "https://api.rolimons.com/items/v2/itemdetails";
    console.log(`[Items API] Fetching all items from ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    console.log(`[Items API] Response status: ${response.status}`);
    console.log(`[Items API] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Items API] Error response:`, errorText);
      throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
    }

    const itemsData = await response.json();
    console.log(`[Items API] Successfully fetched ${Object.keys(itemsData.items || {}).length} items`);
    
    // Cache the data
    itemsCache = itemsData;
    lastFetchTime = now;
    
    return NextResponse.json(itemsData);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : {
      message: String(error)
    };
    
    console.error("[Items API] Detailed error:", errorDetails);
    return NextResponse.json(
      { error: "Failed to fetch items", details: errorDetails.message },
      { status: 500 }
    );
  }
} 