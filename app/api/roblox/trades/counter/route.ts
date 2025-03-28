import { NextResponse } from 'next/server';

interface CounterTradeRequest {
  tradeId: string;
  offerItems: number[];
  requestItems: number[];
}

// Copy the CSRF token function from the accept route
async function fetchSessionCSRFToken(roblosecurityCookie: string): Promise<string | null> {
  try {
    console.log("Fetching CSRF token from Roblox");
    const response = await fetch("https://auth.roblox.com/v2/logout", {
      method: 'POST',
      headers: {
        'Cookie': roblosecurityCookie
      }
    });
    
    const token = response.headers.get('x-csrf-token');
    console.log("CSRF token response:", { status: response.status, token: token ? "Present" : "Missing" });
    
    return token || null;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    // Get request body
    const body: CounterTradeRequest = await request.json();
    const { tradeId, offerItems, requestItems } = body;
    
    if (!tradeId) {
      return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
    }
    
    if (!offerItems || !offerItems.length) {
      return NextResponse.json({ error: 'Offer items are required' }, { status: 400 });
    }
    
    if (!requestItems || !requestItems.length) {
      return NextResponse.json({ error: 'Request items are required' }, { status: 400 });
    }
    
    console.log(`Creating counter trade for ID: ${tradeId}`, {
      offerItemsCount: offerItems.length,
      requestItemsCount: requestItems.length
    });
    
    // Get CSRF token just like accept/decline routes
    const csrfToken = await fetchSessionCSRFToken(cookie);
    
    if (!csrfToken) {
      console.error('Failed to get CSRF token');
      return NextResponse.json({ error: 'Failed to get CSRF token' }, { status: 401 });
    }
    
    console.log('CSRF token obtained successfully');
    
    // Prepare the request body for Roblox API
    const counterTradeBody = {
      offers: [
        {
          userId: null, // This will be populated by the Roblox API
          userAssetIds: offerItems,
          robux: 0 // Usually not used for trades, but required by API
        },
        {
          userId: null, // This will be populated by the Roblox API
          userAssetIds: requestItems,
          robux: 0
        }
      ]
    };
    
    // Make request to Roblox API to create a counter trade
    const response = await fetch(
      `https://trades.roblox.com/v1/trades/${tradeId}/counter`,
      {
        method: 'POST',
        headers: {
          'Cookie': cookie,
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': 'https://www.roblox.com/',
          'Origin': 'https://www.roblox.com',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(counterTradeBody)
      }
    );
    
    let responseData;
    let responseText = '';
    
    try {
      responseText = await response.text();
      // Try to parse as JSON if possible
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawText: responseText };
      }
    } catch (err) {
      responseData = { error: 'Could not read response body' };
    }
    
    if (!response.ok) {
      console.error(`Failed to create counter trade: ${response.status}`, {
        statusText: response.statusText,
        responseData
      });
      
      return NextResponse.json({ 
        error: `Failed to create counter trade: ${response.status} ${response.statusText}`,
        details: responseData
      }, { status: response.status });
    }
    
    console.log(`Successfully created counter trade for ID: ${tradeId}`);
    
    return NextResponse.json({ 
      success: true, 
      data: responseData,
      message: 'Counter trade created successfully' 
    });
  } catch (error) {
    console.error("Error creating counter trade:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 