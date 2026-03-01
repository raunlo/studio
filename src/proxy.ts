import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Map of supported languages
const SUPPORTED_LANGUAGES = ['en', 'et', 'es'];
const DEFAULT_LANGUAGE = 'en';

// Country to language mapping (for geo detection if available)
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // Estonian
  EE: 'et',

  // Spanish speaking countries
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es',
  VE: 'es', CL: 'es', EC: 'es', GT: 'es', CU: 'es',
  BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es',
  NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
};

function parseAcceptLanguage(header: string | null): string {
  if (!header) return DEFAULT_LANGUAGE;

  // Parse Accept-Language header: "es-ES,es;q=0.9,en;q=0.8"
  const languages = header
    .split(',')
    .map(lang => {
      const [code, priority] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(), // Get 'es' from 'es-ES'
        priority: priority ? parseFloat(priority) : 1,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // Find first supported language
  for (const lang of languages) {
    if (SUPPORTED_LANGUAGES.includes(lang.code)) {
      return lang.code;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function proxy(request: NextRequest) {
  // Skip API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if user already has a language preference cookie
  const existingLang = request.cookies.get('i18nextLng')?.value;
  if (existingLang && SUPPORTED_LANGUAGES.includes(existingLang)) {
    return NextResponse.next();
  }

  // Try geo detection first (works on Vercel, may work on Firebase with headers)
  let detectedLang: string | null = null;

  // Check for Cloudflare geo header (if using Cloudflare in front)
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry && COUNTRY_TO_LANGUAGE[cfCountry]) {
    detectedLang = COUNTRY_TO_LANGUAGE[cfCountry];
  }

  // Check for X-Country header (can be set by Cloud Run or load balancer)
  const xCountry = request.headers.get('x-country');
  if (!detectedLang && xCountry && COUNTRY_TO_LANGUAGE[xCountry]) {
    detectedLang = COUNTRY_TO_LANGUAGE[xCountry];
  }

  // Fallback to Accept-Language header (browser preference)
  if (!detectedLang) {
    const acceptLanguage = request.headers.get('accept-language');
    detectedLang = parseAcceptLanguage(acceptLanguage);
  }

  // Set the language cookie
  const response = NextResponse.next();
  response.cookies.set('i18nextLng', detectedLang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  console.log(`[Proxy] Detected language: ${detectedLang}`);

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
