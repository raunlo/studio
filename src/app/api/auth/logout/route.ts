import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Logout request received');

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear all authentication cookies
    response.cookies.delete('user_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('session');

    console.log('✅ All authentication cookies cleared');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' }, 
      { status: 500 }
    );
  }
}
