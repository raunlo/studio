import { NextRequest, NextResponse } from 'next/server'

// Google OAuth initiation endpoint
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }
  
  // Get returnUrl from query params
  const { searchParams } = new URL(request.url)
  const returnUrl = searchParams.get('returnUrl')
  
  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('include_granted_scopes', 'true')
  authUrl.searchParams.set('prompt', 'consent')
  
  // Pass returnUrl through OAuth flow using state parameter
  if (returnUrl) {
    const state = JSON.stringify({ returnUrl })
    authUrl.searchParams.set('state', Buffer.from(state).toString('base64'))
  }
  
  console.log('Redirecting to Google OAuth:', authUrl.toString())
  console.log('Redirect URI:', redirectUri)
  
  return NextResponse.redirect(authUrl.toString())
}
