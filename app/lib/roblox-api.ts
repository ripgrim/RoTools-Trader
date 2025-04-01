import { NextResponse } from 'next/server';

/**
 * Get authenticated user data from Roblox
 * @param cookie Roblox .ROBLOSECURITY cookie
 * @returns Object with success status and user data or error
 */
export async function getAuthenticatedUser(cookie: string | undefined) {
  try {
    console.log("getAuthenticatedUser called, cookie present:", !!cookie);
    
    if (!cookie) {
      console.log("No cookie provided to getAuthenticatedUser");
      return { 
        success: false, 
        status: 401, 
        error: 'Roblox cookie is required' 
      };
    }
    
    // Sanitize cookie if needed (in case it contains the full cookie string with .ROBLOSECURITY=)
    const sanitizedCookie = cookie.includes('.ROBLOSECURITY=') 
      ? cookie.split('.ROBLOSECURITY=')[1].split(';')[0] 
      : cookie;
    
    console.log("Making authenticated request to Roblox API, cookie length:", sanitizedCookie.length);
    
    // Add more browser-like headers to avoid detection as a bot
    const response = await fetch("https://users.roblox.com/v1/users/authenticated", {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${sanitizedCookie}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.roblox.com/',
        'Origin': 'https://www.roblox.com',
      },
      cache: 'no-store',
    });

    console.log("Roblox API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Roblox API error response:", errorText);
      
      // Specific handling for 403 errors
      if (response.status === 403) {
        return { 
          success: false, 
          status: 403, 
          error: `Authentication denied by Roblox: Your cookie may be invalid or expired.` 
        };
      }
      
      return { 
        success: false, 
        status: response.status, 
        error: `Failed to authenticate with Roblox: ${response.status}` 
      };
    }

    const userData = await response.json();
    console.log("Successfully authenticated with Roblox, user ID:", userData.id);
    
    return { 
      success: true, 
      user: userData 
    };
  } catch (error) {
    console.error("Error in getAuthenticatedUser:", error);
    return { 
      success: false, 
      status: 500, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Validate a Roblox cookie directly without fetching user data
 * @param cookie Roblox .ROBLOSECURITY cookie
 * @returns Boolean indicating if the cookie is valid
 */
export async function validateRobloxCookie(cookie: string): Promise<boolean> {
  if (!cookie) return false;
  
  try {
    const authResult = await getAuthenticatedUser(cookie);
    return authResult.success;
  } catch (error) {
    console.error("Cookie validation error:", error);
    return false;
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string | undefined, status: number | undefined) {
  return NextResponse.json(
    { error: error || 'Unknown error' },
    { status: status || 500 }
  );
} 