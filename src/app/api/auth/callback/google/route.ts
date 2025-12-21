import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
  return NextResponse.redirect(new URL('/?error=oauth_error', request.url))
  }

  if (!code) {
  return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed with status:', tokenResponse.status)
  return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    if (!tokens.id_token) {
      console.error('No ID token received:', tokens)
  return NextResponse.redirect(new URL('/?error=token_error', request.url))
    }

    // Get user info from Google using access token (for additional data)
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userResponse.json()

    // Validate Google user data
    if (!userInfo.id || !userInfo.email || !userInfo.name) {
      console.error('Incomplete user info received:', userInfo)
  return NextResponse.redirect(new URL('/?error=invalid_user_data', request.url))
    }

    // Validate Google user ID format
    if (!userInfo.id.match(/^[0-9]{15,25}$/)) {
      console.error('Invalid Google user ID format:', userInfo.id)
  return NextResponse.redirect(new URL('/?error=invalid_user_id', request.url))
    }

    // Additional validation: check if user email is verified
    if (!userInfo.verified_email) {
      console.error('User email not verified')
  return NextResponse.redirect(new URL('/?error=email_not_verified', request.url))
    }

    // Create session data
    const sessionData = {
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.picture,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    console.log('User successfully authenticated:', userInfo.email)
    
    // Create an HTML page that:
    // 1. Stores the token in localStorage for axios interceptor to find
    // 2. Then redirects to home
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Logging in...</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 4px solid rgba(255,255,255,0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <script>
            // ⭐ SECURE: No localStorage - tokens are in httpOnly cookies
            // Browser automatically sends them with every request
            console.log('✅ Authentication successful - redirecting...');
            // Force a hard navigation so the app and any cached client state
            // (e.g. checklist SWR cache) is fully refreshed with the new cookies.
            // Use replace to avoid leaving this intermediate page in history.
            window.location.replace('/checklist');
          </script>
        </body>
      </html>
    `;

    // Create response with HTML
    const response = new NextResponse(htmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
    
    // ⭐ Extract root domain for subdomain cookie sharing
    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000')
    const hostname = nextAuthUrl.hostname
    
    // Get root domain: app.dailychexly.local.com → .dailychexly.local.com
    let cookieDomain: string | undefined = undefined
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.toLowerCase().split('.')

      // app.dailychexly.local.com  -> dailychexly.local.com (no leading dot)
      if (parts.length >= 3 && parts.slice(-2).join('.') === 'local.com') {
      cookieDomain = parts.slice(-3).join('.')
      } else if (parts.length >= 2) {
      // uat.dailychexly.com -> .dailychexly.com (leading dot for subdomain sharing)
      cookieDomain = '.' + parts.slice(-2).join('.')
      }
    }

    console.log('🍪 Setting cookies with domain:', cookieDomain || '(current domain)')
    console.log('🍪 Hostname:', hostname)
    console.log('🍪 Parts:', hostname.split('.'))

    // ⭐ Build Set-Cookie headers manually for better domain control
    const isProduction = process.env.NODE_ENV === 'production'
    console.log('Environment is production:', isProduction)
    const secure = isProduction ? 'Secure; ' : ''
    const domainAttr = cookieDomain ? `Domain=${cookieDomain}; ` : ''
    
    // ⭐ Set cookies using Set-Cookie header directly (gives us full control)
    const setCookieHeaders = [
      `session=${encodeURIComponent(JSON.stringify(sessionData))}; ${domainAttr}Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; ${secure}SameSite=Lax`,
      `user_token=${tokens.id_token}; ${domainAttr}Path=/; Max-Age=${60 * 60}; HttpOnly; ${secure}SameSite=Lax`,
    ]
    
    if (tokens.refresh_token) {
      setCookieHeaders.push(
        `refresh_token=${tokens.refresh_token}; ${domainAttr}Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; ${secure}SameSite=Lax`
      )
      console.log('✅ Refresh token added to cookies (domain:', cookieDomain || 'current', ')')
    }
    
    console.log('✅ Setting cookies:')
    setCookieHeaders.forEach((header, i) => {
      console.log(`  [${i}] ${header.substring(0, 80)}...`)
      response.headers.append('Set-Cookie', header)
    })
    
    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
  return NextResponse.redirect(new URL('/?error=callback_error', request.url))
  }
}
