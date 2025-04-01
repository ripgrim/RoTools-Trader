import { NextResponse } from "next/server";
import { getAuthenticatedUser, createErrorResponse } from '@/app/lib/roblox-api';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Helper function to add CORS headers
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-roblox-cookie');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  try {
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    console.log(`[Profile API] Cookie present: ${!!cookie}`);
    
    if (!cookie) {
      console.log(`[Profile API] No cookie found in request headers`);
      const response = createErrorResponse('Roblox cookie is required', 401);
      return corsHeaders(response);
    }
    
    console.log(`[Profile API] Fetching authenticated user profile`);
    
    // Use shared function to authenticate user
    const authResult = await getAuthenticatedUser(cookie);
    
    console.log(`[Profile API] Auth result: ${authResult.success ? 'Success' : 'Failed'}`);
    
    if (!authResult.success) {
      console.error(`[Profile API] Error fetching authenticated user:`, authResult.error);
      const response = createErrorResponse(authResult.error, authResult.status);
      return corsHeaders(response);
    }

    const userData = authResult.user;
    const userId = userData.id;
    
    console.log(`[Profile API] Authenticated user ID: ${userId}`);
    
    // Since we already have the user data from the authentication call,
    // we can directly return it instead of making another API call
    const response = NextResponse.json(userData);
    return corsHeaders(response);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : {
      message: String(error)
    };
    
    console.error("[Profile API] Detailed error:", errorDetails);
    const response = NextResponse.json(
      { error: "Failed to fetch profile", details: errorDetails.message },
      { status: 500 }
    );
    return corsHeaders(response);
  }
} 