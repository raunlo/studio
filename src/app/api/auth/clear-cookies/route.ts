import { NextResponse } from 'next/server';

export async function POST() {
  // Create response
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies by setting Max-Age=0
  // These are httpOnly so only server can delete them
  const cookiesToClear = ['user_token', 'refresh_token', 'session'];
  
  cookiesToClear.forEach(name => {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Delete immediately
    });
  });

  console.log('🗑️ Server cleared all auth cookies');
  
  return response;
}
