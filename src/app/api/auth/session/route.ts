import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken';


export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('session')
    const userTokenCookie = request.cookies.get('user_token')
    
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value)
      
      // Check if session is still valid
      if (new Date(session.expires) > new Date()) {
        // Also validate the user token if it exists
        if (userTokenCookie) {
          try {
            const decoded = jwt.decode(userTokenCookie.value) as any;
            if (decoded && decoded.exp && Date.now() < decoded.exp * 1000) {
              return NextResponse.json(session)
            } else {
              console.log('User token expired')
              // Token is expired, but session exists - return session but mark as needing refresh
              return NextResponse.json({ ...session, needsTokenRefresh: true })
            }
          } catch (decodeError) {
            console.log('Error decoding user token:', decodeError)
            return NextResponse.json({ ...session, needsTokenRefresh: true })
          }
        }
        return NextResponse.json(session)
      } else {
        console.log('Session cookie expired')
      }
    } else {
      console.log('No session cookie found')
    }
    
    return NextResponse.json({ user: null })
  } catch (error) {
    console.error('Session endpoint error:', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE(request: NextRequest) {
  // Logout - clear both session and JWT token cookies
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete('session')
  response.cookies.delete('user_token')
  return response
}
