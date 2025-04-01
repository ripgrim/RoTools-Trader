import { NextResponse } from 'next/server';
import { getAuthenticatedUser, createErrorResponse } from '@/app/lib/roblox-api';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return createErrorResponse('Roblox cookie is required', 401);
    }
    
    console.log("Fetching authenticated user data");
    
    // Use shared function to authenticate user
    const result = await getAuthenticatedUser(cookie);
    
    if (!result.success) {
      console.error("Failed to fetch user data:", result.error);
      return createErrorResponse(result.error, result.status);
    }
    
    console.log("Successfully fetched user data", { userId: result.user.id });
    
    return NextResponse.json(result.user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 