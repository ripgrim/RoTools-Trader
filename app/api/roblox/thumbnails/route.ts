import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const assetIds = url.searchParams.get('assetIds');
    const size = url.searchParams.get('size') || '150x150';
    const format = url.searchParams.get('format') || 'Png';
    const noFilter = url.searchParams.get('noFilter') || 'true';
    
    if (!assetIds) {
      return NextResponse.json({ error: 'assetIds parameter is required' }, { status: 400 });
    }
    
    console.log(`Fetching thumbnails for assets: ${assetIds}, size: ${size}, format: ${format}`);
    
    // Make request to Roblox thumbnails API
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&size=${size}&format=${format}&noFilter=${noFilter}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error("Failed to fetch thumbnails:", response.status, response.statusText);
      return NextResponse.json({ 
        error: `Failed to fetch thumbnails: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log("Successfully fetched thumbnails", { 
      count: data.data?.length || 0,
      completedCount: data.data?.filter((item: any) => item.state === "Completed").length || 0,
      firstUrl: data.data?.[0]?.imageUrl ? "URL received" : "No URL",
      sample: data.data?.[0]?.imageUrl?.substring(0, 50) + "..." || "None"
    });
    
    // Example response structure from Roblox:
    // {"data":[{"targetId":19027209,"state":"Completed","imageUrl":"https://tr.rbxcdn.com/180DAY-af040cb070d8856631cffc8d1ad0958c/420/420/Hat/Png/noFilter","version":"TN3"}]}
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching thumbnails:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 