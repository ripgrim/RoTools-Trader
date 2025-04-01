import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/roblox-api';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    const result = await getAuthenticatedUser(token);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    const userData = result.user;
    return NextResponse.json({ 
      isValid: true,
      user: {
        id: userData.id,
        name: userData.name,
        displayName: userData.displayName,
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
} 