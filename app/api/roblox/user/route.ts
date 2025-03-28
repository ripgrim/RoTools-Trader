import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // Get the cookie from headers
    const cookie = request.headers.get('x-roblox-cookie');
    
    if (!cookie) {
      return NextResponse.json({ error: 'Roblox cookie is required' }, { status: 401 });
    }
    
    console.log("Fetching authenticated user data");
    
    // Make request to Roblox API
    const response = await fetch(
      'https://users.roblox.com/v1/users/authenticated',
      {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error("Failed to fetch user data:", response.status, response.statusText);
      return NextResponse.json({ 
        error: `Failed to fetch user data: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log("Successfully fetched user data", { userId: data.id });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 