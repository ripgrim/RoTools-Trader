import { NextResponse } from 'next/server';

// For development testing - set to true to skip actual Roblox API calls
const MOCK_MODE = true;

// Utility function to fetch CSRF token
async function fetchSessionCSRFToken(roblosecurityCookie: string): Promise<string | null> {
  if (MOCK_MODE) {
    console.log("MOCK MODE: Returning mock CSRF token");
    return "mock-csrf-token";
  }

  try {
    console.log("Fetching CSRF token from Roblox");
    const response = await fetch("https://auth.roblox.com/v2/logout", {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
      }
    });
    
    const token = response.headers.get('x-csrf-token');
    console.log("CSRF token response:", { status: response.status, token });
    
    return token || null;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
}

// Authentication ticket generation
async function generateAuthTicket(roblosecurityCookie: string): Promise<string | null> {
  if (MOCK_MODE) {
    console.log("MOCK MODE: Returning mock auth ticket");
    return "mock-auth-ticket";
  }

  try {
    console.log("Generating auth ticket");
    const csrfToken = await fetchSessionCSRFToken(roblosecurityCookie);
    
    if (!csrfToken) {
      throw new Error("Failed to obtain CSRF token");
    }
    
    console.log("Making auth ticket request with CSRF token:", csrfToken);
    const response = await fetch("https://auth.roblox.com/v1/authentication-ticket", {
      method: 'POST',
      headers: {
        "x-csrf-token": csrfToken,
        "referer": "https://www.roblox.com",
        'Content-Type': 'application/json',
        'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
      }
    });

    if (!response.ok) {
      console.error("Auth ticket generation failed:", response.status, response.statusText);
      throw new Error(`Failed to generate auth ticket: ${response.status}`);
    }

    const ticket = response.headers.get('rbx-authentication-ticket');
    console.log("Auth ticket response:", { status: response.status, ticket: ticket ? "Present" : "Missing" });
    
    return ticket || null;
  } catch (error) {
    console.error("Ticket generation failed:", error);
    return null;
  }
}

// Ticket redemption
async function redeemAuthTicket(authTicket: string): Promise<{
  success: boolean;
  refreshedCookie?: string;
  error?: string;
}> {
  if (MOCK_MODE) {
    console.log("MOCK MODE: Returning mock refreshed cookie");
    return {
      success: true,
      refreshedCookie: "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_MOCK-COOKIE"
    };
  }

  try {
    console.log("Redeeming auth ticket");
    const response = await fetch("https://auth.roblox.com/v1/authentication-ticket/redeem", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RBXAuthenticationNegotiation': '1'
      },
      body: JSON.stringify({ authenticationTicket: authTicket })
    });

    if (!response.ok) {
      console.error("Ticket redemption failed:", response.status, response.statusText);
      throw new Error(`Ticket redemption failed: ${response.status}`);
    }

    const setCookieHeader = response.headers.get('set-cookie') || "";
    console.log("Set-Cookie header received:", setCookieHeader ? "Present" : "Missing");
    
    const refreshedCookieMatch = setCookieHeader.match(/(_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-Za-z0-9]+)/);
    console.log("Cookie match result:", refreshedCookieMatch ? "Found" : "Not found");

    return {
      success: true,
      refreshedCookie: refreshedCookieMatch ? refreshedCookieMatch[0] : undefined
    };
  } catch (error) {
    console.error("Redemption error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Main API route handler
export async function POST(request: Request) {
  console.log("Roblox cookie refresh request received");
  
  try {
    const body = await request.json();
    const { roblosecurityCookie } = body;
    
    console.log("Request body parsed:", { cookiePresent: !!roblosecurityCookie });

    // Validate input
    if (!roblosecurityCookie) {
      return NextResponse.json({ error: "Cookie is required" }, { status: 400 });
    }

    // Generate authentication ticket
    console.log("Generating auth ticket...");
    const authTicket = await generateAuthTicket(roblosecurityCookie);
    
    if (!authTicket) {
      return NextResponse.json({ error: "Failed to generate auth ticket" }, { status: 400 });
    }

    // Redeem ticket
    console.log("Redeeming auth ticket...");
    const redemptionResult = await redeemAuthTicket(authTicket);

    if (!redemptionResult.success || !redemptionResult.refreshedCookie) {
      return NextResponse.json({ 
        error: redemptionResult.error || "Ticket redemption failed" 
      }, { status: 401 });
    }

    // Return successful response
    console.log("Auth process successful, returning refreshed cookie");
    return NextResponse.json({
      refreshedCookie: redemptionResult.refreshedCookie,
      authTicket
    });

  } catch (error) {
    console.error("Refresh process error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 