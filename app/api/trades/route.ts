import { NextResponse } from 'next/server';
import { Trade } from '@/app/types/trade';
import { mockTrades } from '@/app/mocks/trades';

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

export async function GET() {
  return NextResponse.json({ trades: mockTrades });
}

export async function POST(request: Request) {
  try {
    console.log('Received POST request to /api/trades');
    
    const { tradeId, action } = await request.json();
    console.log('Request body:', { tradeId, action });
    
    if (!tradeId || !action) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Trade ID and action are required' },
        { status: 400 }
      );
    }

    // Get token from header
    const token = request.headers.get('x-roblox-token');
    console.log('Token from header:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No token provided in headers');
      return NextResponse.json(
        { error: 'Roblox security token is required' },
        { status: 401 }
      );
    }

    // Make request to Roblox API
    console.log('Making request to Roblox API...');
    const response = await fetch(`https://trades.roblox.com/v1/trades/${tradeId}/${action}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'Cookie': `GuestData=UserID=-681393763; RBXSource=rbx_acquisition_time=03/08/2025 07:15:55&rbx_acquisition_referrer=https://www.roblox.com/&rbx_medium=Social&rbx_source=www.roblox.com&rbx_campaign=&rbx_adgroup=&rbx_keyword=&rbx_matchtype=&rbx_send_info=0; .RBXIDCHECK=934e1840-dcbb-4728-8864-e804eb6d2e98; rbxas=a688df76d50fb0c6a89dd2156ce70ad5d6952620e03217b7a72b4443582bb6a8; RBXEventTrackerV2=CreateDate=03/11/2025 03:38:50&rbxid=1521126&browserid=1741418148444003; .ROBLOSECURITY=${token}; RBXSessionTracker=sessionid=fe78d18a-51bf-4762-be61-cb21c30055f8; rbx-ip2=rbx-ip2`,
        'dnt': '1',
        'origin': 'https://www.roblox.com',
        'priority': 'u=1, i',
        'referer': 'https://www.roblox.com/',
        'sec-ch-ua': '"Not:A-Brand";v="24", "Chromium";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'x-bound-auth-token': 'v1|47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=|1743057336|ZecToQxM3z1tv7jYHPenn+MxNPjWyIAEaNB5vyuPIjeMlqvU19SfO31jwpdNgwlGRDRPtNoNdylJNSExdNmKjg=='
      }
    });

    if (!response.ok) {
      console.error('Roblox API error:', response.status, response.statusText);
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid or expired Roblox security token' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Failed to ${action} trade` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully processed trade action');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/trades POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}