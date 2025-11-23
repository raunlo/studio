import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Refresh request received')

    // ⭐ SECURE: Only read from httpOnly cookie
    const refreshToken = request.cookies.get('refresh_token')?.value
    console.log('Refresh token from cookie:', refreshToken ? 'present' : 'NOT FOUND')

    if (!refreshToken) {
      console.log('No refresh token found - user needs to re-authenticate')
      return NextResponse.json({
        error: 'No refresh token',
        message: 'Your session has expired. Please sign in again.',
        code: 'REFRESH_TOKEN_MISSING'
      }, { status: 401 })
    }

    console.log('Attempting to refresh token with stored refresh_token')

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokenResponse.status === 400) {
      // Refresh token is invalid/expired
      console.log('Refresh token expired or invalid - user needs to re-authenticate')
      const response = NextResponse.json({
        error: 'Refresh token expired',
        message: 'Your session has expired. Please sign in again.',
        code: 'REFRESH_TOKEN_EXPIRED'
      }, { status: 401 })

      // Clear the invalid refresh token
      response.cookies.delete('refresh_token')
      return response
    }

    if (tokenResponse.status !== 200) {
      console.error('Token refresh failed with status:', tokenResponse.status, tokens)
      return NextResponse.json({
        error: 'Token refresh failed',
        message: 'Failed to refresh your session. Please try signing in again.'
      }, { status: 500 })
    }

    if (!tokens.id_token) {
      console.error('No ID token in successful refresh response:', tokens)
      return NextResponse.json({
        error: 'Invalid refresh response',
        message: 'Received invalid response from authentication service.'
      }, { status: 500 })
    }

    console.log('Token refresh successful, new token expires in:', tokens.expires_in)

    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed successfully'
    })

    // ⭐ Extract root domain for subdomain cookie sharing
    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000')
    const hostname = nextAuthUrl.hostname
    
    let cookieDomain: string | undefined = undefined
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.split('.')
      if (parts.length >= 2) {
        const rootDomainParts = parts.length >= 3 ? 3 : 2
        cookieDomain = '.' + parts.slice(-rootDomainParts).join('.')
      }
    }

    // ⭐ Build Set-Cookie headers manually for better domain control
    const isProduction = process.env.NODE_ENV === 'production'
    const secure = isProduction ? 'Secure; ' : ''
    const domainAttr = cookieDomain ? `Domain=${cookieDomain}; ` : ''
    
    const setCookieHeaders = [
      `user_token=${tokens.id_token}; ${domainAttr}Path=/; Max-Age=${60 * 60}; HttpOnly; ${secure}SameSite=Lax`,
    ]

    // Google may provide a new refresh token
    if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
      console.log('Received new refresh token from Google')
      setCookieHeaders.push(
        `refresh_token=${tokens.refresh_token}; ${domainAttr}Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; ${secure}SameSite=Lax`
      )
    }
    
    console.log('✅ Updating cookies (domain:', cookieDomain || 'current', ')')
    setCookieHeaders.forEach((header, i) => {
      console.log(`  [${i}] ${header.substring(0, 80)}...`)
      response.headers.append('Set-Cookie', header)
    })

    return response

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
