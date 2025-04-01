import { NextResponse } from 'next/server';
import { Trade } from '@/app/types/trade';
import { getAuthenticatedUser, createErrorResponse } from '@/app/lib/roblox-api';

async function fetchRobloxTrades(token: string): Promise<Trade[]> {
  const response = await fetch('https://trades.roblox.com/v1/trades/list?limit=100&sortOrder=Desc', {
    headers: {
      'Cookie': `.ROBLOSECURITY=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trades from Roblox');
  }

  const data = await response.json();
  return data.data.map((trade: any) => ({
    id: trade.id,
    user: {
      id: trade.user.id,
      name: trade.user.name,
      displayName: trade.user.displayName,
    },
    status: trade.status,
    items: {
      offering: trade.offers.map((item: any) => ({
        id: item.id,
        name: item.name,
        assetType: item.type,
        thumbnail: item.thumbnailUrl,
      })),
      requesting: trade.requests.map((item: any) => ({
        id: item.id,
        name: item.name,
        assetType: item.type,
        thumbnail: item.thumbnailUrl,
      })),
    },
    created: trade.created,
  }));
}

export async function GET(request: Request) {
  try {
    console.log('Received GET request to /api/trades');
    
    // Get token from header
    const token = request.headers.get('x-roblox-cookie');
    console.log('Cookie from header:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No cookie provided in headers');
      return createErrorResponse('Roblox cookie is required', 401);
    }
    
    // Validate the token
    const authResult = await getAuthenticatedUser(token);
    if (!authResult.success) {
      console.error('Authentication failed:', authResult.error);
      return createErrorResponse(authResult.error, authResult.status);
    }
    
    // Fetch real trades from Roblox
    console.log('Fetching trades from Roblox...');
    const trades = await fetchRobloxTrades(token);
    console.log(`Successfully fetched ${trades.length} trades`);
    
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error in /api/trades GET:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch trades',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Received POST request to /api/trades');
    
    const { tradeId, action } = await request.json();
    console.log('Request body:', { tradeId, action });
    
    if (!tradeId || !action) {
      console.log('Missing required fields');
      return createErrorResponse('Trade ID and action are required', 400);
    }

    // Get token from header - use the same header name as in GET for consistency
    const token = request.headers.get('x-roblox-cookie');
    console.log('Cookie from header:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No cookie provided in headers');
      return createErrorResponse('Roblox cookie is required', 401);
    }

    // Validate the token
    const authResult = await getAuthenticatedUser(token);
    if (!authResult.success) {
      console.error('Authentication failed:', authResult.error);
      return createErrorResponse(authResult.error, authResult.status);
    }

    // Make request to Roblox API
    console.log('Making request to Roblox API...');
    const response = await fetch(`https://trades.roblox.com/v1/trades/${tradeId}/${action}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'Cookie': `.ROBLOSECURITY=${token}`,
        'dnt': '1',
        'origin': 'https://www.roblox.com',
        'referer': 'https://www.roblox.com/',
        'sec-ch-ua': '"Not:A-Brand";v="24", "Chromium";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('Roblox API error:', response.status, response.statusText);
      if (response.status === 401) {
        return createErrorResponse('Invalid or expired Roblox security token', 401);
      }
      return createErrorResponse(`Failed to ${action} trade`, response.status);
    }

    const data = await response.json();
    console.log('Successfully processed trade action');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/trades POST:', error);
    return createErrorResponse('Internal server error', 500);
  }
}