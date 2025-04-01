import { NextResponse } from "next/server";

// Cache the items data in memory
let itemsCache: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 0; // Disable caching temporarily

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (itemsCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log("[Items API] Returning cached data");
      return NextResponse.json(itemsCache);
    }

    const url = "https://api.rolimons.com/items/v2/itemdetails";
    console.log(`[Items API] Fetching all items from ${url} at ${now}`);
    
    // Add a cache-busting parameter
    const cacheBusterUrl = `${url}?t=${now}`;
    
    const response = await fetch(cacheBusterUrl, {
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
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

/*
rolimons.com/items/v2/itemdetails
sample response:
{
  "success": true,
  "item_count": 2523,
  "items": {
    "1028606": [
      "Red Baseball Cap",
      "",
      1283, -1, 1283, -1, -1, -1, -1, -1, 1],
    "1028720": [
      "Classic ROBLOX Viking Helm",
      "",
      10350, -1, 10350, -1, -1, -1, -1, -1, 1],
    ...
  }
}

rubric:
[item_name, acronym, rap, value, default_value, demand, trend, projected, hyped, rare]

item_name:
- string
acronym:
- string
rap:
- number
value:
- number
default_value:
- number
demand:
- number
trend:
- number
projected:
- number
hyped:
- number
rare:
- number

Demand:

```
-1 | None  
0  | Terrible  
1  | Low  
2  | Normal  
3  | High  
4  | Amazing  
```
Trend:
```
-1 | None  
0  | Lowering  
1  | Unstable  
2  | Stable  
3  | Raising  
4  | Fluctuating  
```
Projected:
```
-1 | False  
1  | True  
```
Hyped:
```
-1 | False  
1  | True  
```
Rare:
```
-1 | False  
1  | True  
```

*/