import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const userIds = url.searchParams.get('userIds');
    const size = url.searchParams.get('size') || '150x150';
    const format = url.searchParams.get('format') || 'Png';
    const type = url.searchParams.get('type') || 'AvatarHeadshot'; // AvatarHeadshot, AvatarBust, Avatar
    const isCircular = url.searchParams.get('isCircular') || 'false';
    
    if (!userIds) {
      return NextResponse.json({ error: 'userIds parameter is required' }, { status: 400 });
    }
    
    console.log(`Fetching avatar thumbnails for users: ${userIds}, type: ${type}, size: ${size}, isCircular: ${isCircular}`);
    
    // Make request to Roblox thumbnails API
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-${type.toLowerCase()}?userIds=${userIds}&size=${size}&format=${format}&isCircular=${isCircular}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error("Failed to fetch avatar thumbnails:", response.status, response.statusText);
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
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
} 