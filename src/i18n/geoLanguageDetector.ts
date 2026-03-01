/**
 * Geo-based language detection using IP geolocation
 * Maps countries to their primary languages
 */

// Country code to language mapping
const countryToLanguage: Record<string, string> = {
  // Estonian
  EE: 'et',

  // Spanish speaking countries
  ES: 'es', // Spain
  MX: 'es', // Mexico
  AR: 'es', // Argentina
  CO: 'es', // Colombia
  PE: 'es', // Peru
  VE: 'es', // Venezuela
  CL: 'es', // Chile
  EC: 'es', // Ecuador
  GT: 'es', // Guatemala
  CU: 'es', // Cuba
  BO: 'es', // Bolivia
  DO: 'es', // Dominican Republic
  HN: 'es', // Honduras
  PY: 'es', // Paraguay
  SV: 'es', // El Salvador
  NI: 'es', // Nicaragua
  CR: 'es', // Costa Rica
  PA: 'es', // Panama
  UY: 'es', // Uruguay
  PR: 'es', // Puerto Rico

  // English speaking countries (fallback is English anyway)
  US: 'en',
  GB: 'en',
  AU: 'en',
  CA: 'en',
  NZ: 'en',
  IE: 'en',
};

const GEO_LANGUAGE_KEY = 'geoLanguageDetected';
const SUPPORTED_LANGUAGES = ['en', 'et', 'es'];

interface GeoResponse {
  country_code?: string;
  country?: string;
}

/**
 * Detects language based on user's geographic location using IP
 * Runs only once - when user has never had a language preference
 */
export async function detectLanguageByGeo(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Check if user has already set a language preference
  const userLanguage = localStorage.getItem('i18nextLng');
  if (userLanguage) {
    return null;
  }

  // Check if we've already attempted geo detection
  const geoAttempted = localStorage.getItem(GEO_LANGUAGE_KEY);
  if (geoAttempted) {
    return null;
  }

  try {
    let countryCode: string | undefined;

    // Try ipinfo.io first (HTTPS, reliable, free tier)
    try {
      const response = await fetch('https://ipinfo.io/json', {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        countryCode = data.country;
      }
    } catch {
      // Fallback to backup API
    }

    // Fallback to ipapi.co if first one failed
    if (!countryCode) {
      try {
        const response = await fetch('https://ipapi.co/country_code/', {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          countryCode = await response.text();
        }
      } catch {
        // Both APIs failed
      }
    }

    if (countryCode && countryToLanguage[countryCode]) {
      const detectedLanguage = countryToLanguage[countryCode];
      if (SUPPORTED_LANGUAGES.includes(detectedLanguage)) {
        return detectedLanguage;
      }
    }

    // Mark as attempted if no match found
    localStorage.setItem(GEO_LANGUAGE_KEY, 'true');
    return null;
  } catch {
    localStorage.setItem(GEO_LANGUAGE_KEY, 'true');
    return null;
  }
}
