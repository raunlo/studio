import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_DIRECT_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://checklist-app-go-qqzjtedwva-ez.a.run.app';

export async function POST(request: NextRequest) {
  try {
    console.log('Logout request received, proxying to backend');

    // Get cookies from incoming request
    const cookieHeader = request.headers.get('cookie') || '';

    // Call backend logout endpoint
    // Backend will invalidate the session in database and clear session_id cookie
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log('✅ Backend logout successful');

      // Create response and forward Set-Cookie headers from backend
      const response = NextResponse.json({
        success: true,
        message: data.message || 'Logged out successfully',
      });

      // Forward any Set-Cookie headers from backend (session_id cookie deletion)
      const setCookieHeaders = backendResponse.headers.get('set-cookie');
      if (setCookieHeaders) {
        response.headers.set('Set-Cookie', setCookieHeaders);
      }

      return response;
    } else {
      console.error('Backend logout failed:', backendResponse.status);
      return NextResponse.json(
        { error: 'Backend logout failed' },
        { status: backendResponse.status },
      );
    }
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 },
    );
  }
}
