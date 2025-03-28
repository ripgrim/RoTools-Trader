import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get trade ID from route params
    const tradeId = params.id;
    
    if (!tradeId) {
      return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
    }
    
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    console.log(`Fetching trade details for ID: ${tradeId}`);
    
    // Make request to Roblox API
    const response = await fetch(
      `https://trades.roblox.com/v1/trades/${tradeId}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch trade details: ${response.status}`, response.statusText);
      return NextResponse.json({ 
        error: `Failed to fetch trade details: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log(`Successfully fetched trade details for ID: ${tradeId}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching trade details:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 