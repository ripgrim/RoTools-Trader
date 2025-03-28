import { NextResponse } from 'next/server';

// Default SVG avatar
const DEFAULT_AVATAR = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'>
  <rect width='150' height='150' fill='#2A2A2A'/>
  <path d='M75,40 C87,40 97,50 97,62 C97,74 87,84 75,84 C63,84 53,74 53,62 C53,50 63,40 75,40 Z M75,94 C98,94 116,105 116,120 L116,125 L34,125 L34,120 C34,105 52,94 75,94 Z' fill='#666666'/>
</svg>`;

export async function GET(request: Request) {
  try {
    // Get the userId from the URL parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If we have a userId, try to fetch from Roblox
    if (userId) {
      try {
        // First try to fetch from Roblox thumbnail API
        const robloxResponse = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`,
          { next: { revalidate: 3600 } } // Cache for 1 hour
        );
        
        if (robloxResponse.ok) {
          const data = await robloxResponse.json();
          if (data.data && data.data.length > 0 && data.data[0].imageUrl) {
            // Redirect to the Roblox image URL
            return NextResponse.redirect(data.data[0].imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching Roblox avatar:', error);
        // Continue to fallback
      }
    }
    
    // If we couldn't get a Roblox avatar, return the default SVG
    return new NextResponse(DEFAULT_AVATAR, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    });
  } catch (error) {
    console.error('Fallback avatar error:', error);
    
    // Return the default SVG on any error
    return new NextResponse(DEFAULT_AVATAR, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    });
  }
} 