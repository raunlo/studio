import { NextRequest, NextResponse } from 'next/server';

function computeCookieDomainFromNextAuthUrl(): string | undefined {
  const nextAuthUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
  const hostname = nextAuthUrl.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return undefined;
  }

  const parts = hostname.toLowerCase().split('.');

  // app.dailychexly.local.com -> dailychexly.local.com (no leading dot)
  if (parts.length >= 3 && parts.slice(-2).join('.') === 'local.com') {
    return parts.slice(-3).join('.');
  }

  // uat.dailychexly.com -> .dailychexly.com (leading dot for subdomain sharing)
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }

  return undefined;
}

function buildDeleteCookieHeader(options: {
  name: string;
  domain?: string;
  secure: boolean;
}): string {
  const domainAttr = options.domain ? `Domain=${options.domain}; ` : '';
  const secureAttr = options.secure ? 'Secure; ' : '';

  // Match login cookie attributes to ensure deletion hits the same cookie.
  // Max-Age=0 + Expires in the past covers more clients.
  return `${options.name}=; ${domainAttr}Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${secureAttr}SameSite=Lax`;
}

export async function POST(_request: NextRequest) {
  try {
    console.log('Logout request received');

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = computeCookieDomainFromNextAuthUrl();

    const cookieNames = ['session', 'user_token', 'refresh_token'] as const;

    // Delete cookies for BOTH:
    // 1) the explicit Domain used during login (e.g. .dailychexly.com)
    // 2) no Domain attribute (covers older/local cookies)
    for (const name of cookieNames) {
      response.headers.append(
        'Set-Cookie',
        buildDeleteCookieHeader({ name, domain: cookieDomain, secure: isProduction }),
      );
      response.headers.append(
        'Set-Cookie',
        buildDeleteCookieHeader({ name, domain: undefined, secure: isProduction }),
      );
    }

    console.log('✅ Logout Set-Cookie headers appended (domain:', cookieDomain || '(none)', ')');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 },
    );
  }
}
