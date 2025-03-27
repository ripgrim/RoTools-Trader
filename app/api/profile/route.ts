import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Hardcoded to your profile ID for now
    const userId = "1517579"; // Replace with your actual ID
    const url = `https://users.roblox.com/v1/users/${userId}`;
    
    console.log(`[Profile API] Fetching profile for user ${userId}`);
    console.log(`[Profile API] Request URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    console.log(`[Profile API] Response status: ${response.status}`);
    console.log(`[Profile API] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Profile API] Error response:`, errorText);
      throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
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