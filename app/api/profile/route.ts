import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    console.log(`[Profile API] Fetching authenticated user profile`);
    
    // First, fetch the authenticated user's info
    const authUserResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Accept': 'application/json',
      },
    });

    if (!authUserResponse.ok) {
      const errorText = await authUserResponse.text();
      console.error(`[Profile API] Error fetching authenticated user:`, errorText);
      return NextResponse.json(
        { error: `Failed to fetch authenticated user: ${authUserResponse.status}` },
        { status: authUserResponse.status }
      );
    }

    const authUserData = await authUserResponse.json();
    const userId = authUserData.id;
    
    console.log(`[Profile API] Authenticated user ID: ${userId}`);
    
    // Now fetch the full profile using the user ID
    const profileUrl = `https://users.roblox.com/v1/users/${userId}`;
    console.log(`[Profile API] Request URL: ${profileUrl}`);
    
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Accept': 'application/json',
      },
    });

    console.log(`[Profile API] Response status: ${profileResponse.status}`);

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(`[Profile API] Error response:`, errorText);
      throw new Error(`Failed to fetch profile: ${profileResponse.status} ${profileResponse.statusText}`);
    }

    const userData = await profileResponse.json();
    console.log(`[Profile API] Raw response data:`, JSON.stringify(userData, null, 2));
    
    return NextResponse.json(userData);
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
    return NextResponse.json(
      { error: "Failed to fetch profile", details: errorDetails.message },
      { status: 500 }
    );
  }
} 