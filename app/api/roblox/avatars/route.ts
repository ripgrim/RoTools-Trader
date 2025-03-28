import { NextResponse } from 'next/server';

// Function to retry fetch with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // If rate limited or server error, retry
      if (response.status === 429 || response.status >= 500) {
        retries++;
        console.log(`Retrying fetch (${retries}/${maxRetries}) after error:`, response.status);
        // Wait with exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      // For other errors, return the response immediately
      return response;
    } catch (error) {
      retries++;
      console.error(`Fetch attempt ${retries} failed:`, error);
      if (retries >= maxRetries) throw error;
      // Wait before retrying
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
    }
  }
  
  throw new Error('Max retries reached');
}

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const userIds = url.searchParams.get('userIds');
    const size = url.searchParams.get('size') || '150x150';
    const format = url.searchParams.get('format') || 'Png';
    const type = url.searchParams.get('type') || 'avatar-headshot'; // AvatarHeadshot, AvatarBust, Avatar
    const isCircular = url.searchParams.get('isCircular') || 'false';
    
    if (!userIds) {
      return NextResponse.json({ error: 'userIds parameter is required' }, { status: 400 });
    }
    
    console.log(`Fetching avatar thumbnails for users: ${userIds}, type: ${type}, size: ${size}, isCircular: ${isCircular}`);
    
    // Make request to Roblox thumbnails API with retry
    const response = await fetchWithRetry(
      `https://thumbnails.roblox.com/v1/users/${type.toLowerCase()}?userIds=${userIds}&size=${size}&format=${format}&isCircular=${isCircular}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        cache: 'no-store'
      },
      2 // Max retries
    );
    
    if (!response.ok) {
      console.error("Failed to fetch avatar thumbnails:", response.status, response.statusText);
      
      // Return a "successful" response with empty data to prevent client errors
      if (response.status >= 500 || response.status === 429) {
        console.log("Returning empty data instead of error for server issue");
        return NextResponse.json({ 
          data: [],
          message: `Roblox API temporarily unavailable: ${response.status}` 
        }, { status: 200 });
      }
      
      return NextResponse.json({ 
        error: `Failed to fetch avatar thumbnails: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log("Successfully fetched avatar thumbnails", { 
      count: data.data?.length || 0,
      example: data.data?.[0]?.imageUrl ? "Image URL received" : "No image URL" 
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching avatar thumbnails:", error);
    
    // Return a "successful" response with empty data rather than error
    return NextResponse.json({ 
      data: [],
      message: error instanceof Error ? error.message : "Internal server error",
    }, { status: 200 });
  }
} 