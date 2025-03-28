import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '25';
    const cursor = url.searchParams.get('cursor') || '';
    const sortOrder = url.searchParams.get('sortOrder') || 'Desc';
    
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    console.log("Fetching inbound trades with cursor:", cursor || "none");
    
    // Make request to Roblox API
    const response = await fetch(
      `https://trades.roblox.com/v1/trades/inbound?cursor=${cursor}&limit=${limit}&sortOrder=${sortOrder}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error("Failed to fetch inbound trades:", response.status, response.statusText);
      return NextResponse.json({ 
        error: `Failed to fetch inbound trades: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log("Successfully fetched inbound trades", { count: data.data?.length || 0 });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching inbound trades:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 