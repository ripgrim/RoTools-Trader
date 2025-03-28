import { NextResponse } from 'next/server';

// Copy the CSRF token function from the refresh route with the EXACT same pattern
async function fetchSessionCSRFToken(roblosecurityCookie: string): Promise<string | null> {
  try {
    console.log("Fetching CSRF token from Roblox");
    
    // Debug log for cookie format
    console.log("Cookie format:", { 
      length: roblosecurityCookie.length,
      hasPrefix: roblosecurityCookie.startsWith('.ROBLOSECURITY=')
    });
    
    // IMPORTANT: Notice the format here - it adds .ROBLOSECURITY= prefix
    const response = await fetch("https://auth.roblox.com/v2/logout", {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
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

export async function POST(
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
    let cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    // Remove .ROBLOSECURITY= prefix if present (since our function adds it)
    if (cookie.startsWith('.ROBLOSECURITY=')) {
      cookie = cookie.substring('.ROBLOSECURITY='.length);
    }
    
    console.log(`Declining trade with ID: ${tradeId}`);

    // Get CSRF token using the existing function from auth popup
    const csrfToken = await fetchSessionCSRFToken(cookie);
    
    if (!csrfToken) {
      console.error('Failed to get CSRF token');
      return NextResponse.json({ error: 'Failed to get CSRF token' }, { status: 401 });
    }
    
    console.log('CSRF token obtained successfully');
    
    // Make request to Roblox API
    const response = await fetch(
      `https://trades.roblox.com/v1/trades/${tradeId}/decline`,
      {
        method: 'POST',
        headers: {
          // IMPORTANT: Same pattern as the working code - add the prefix
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': 'https://www.roblox.com/',
          'Origin': 'https://www.roblox.com',
          'x-csrf-token': csrfToken,
        },
      }
    );
    
    // Get response data for better error reporting
    let responseText;
    let responseData;
    
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
      console.error(`Failed to decline trade: ${response.status}`, {
        statusText: response.statusText,
        responseData
      });
      
      return NextResponse.json({ 
        error: `Failed to decline trade: ${response.status} ${response.statusText}`,
        details: responseData
      }, { status: response.status });
    }
    
    console.log(`Successfully declined trade with ID: ${tradeId}`);
    
    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error declining trade:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 