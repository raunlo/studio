/**
 * Geo-based language detection using IP geolocation
 * Maps countries to their primary languages
 */

// Country code to language mapping
const countryToLanguage: Record<string, string> = {
  // Estonian
  'EE': 'et',
  
  // Spanish speaking countries
  'ES': 'es', // Spain
  'MX': 'es', // Mexico
  'AR': 'es', // Argentina
  'CO': 'es', // Colombia
  'PE': 'es', // Peru
  'VE': 'es', // Venezuela
  'CL': 'es', // Chile
  'EC': 'es', // Ecuador
  'GT': 'es', // Guatemala
  'CU': 'es', // Cuba
  'BO': 'es', // Bolivia
  'DO': 'es', // Dominican Republic
  'HN': 'es', // Honduras
  'PY': 'es', // Paraguay
  'SV': 'es', // El Salvador
  'NI': 'es', // Nicaragua
  'CR': 'es', // Costa Rica
  'PA': 'es', // Panama
  'UY': 'es', // Uruguay
  'PR': 'es', // Puerto Rico
  
  // English speaking countries (fallback is English anyway)
  'US': 'en',
  'GB': 'en',
  'AU': 'en',
  'CA': 'en',
  'NZ': 'en',
  'IE': 'en',
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
  
  console.log('[GeoDetect] Starting geo detection...');
  
  // Check if user has already set a language preference (either manually or via geo)
  const userLanguage = localStorage.getItem('i18nextLng');
  console.log('[GeoDetect] i18nextLng in localStorage:', userLanguage);
  if (userLanguage) {
    console.log('[GeoDetect] User already has language, skipping geo');
    return null; // User already has a language, don't override
  }
  
  // Check if we've already attempted geo detection and it failed/had no match
  const geoAttempted = localStorage.getItem(GEO_LANGUAGE_KEY);
  console.log('[GeoDetect] geoLanguageDetected in localStorage:', geoAttempted);
  if (geoAttempted) {
    console.log('[GeoDetect] Already attempted geo, skipping');
    return null; // Already tried geo, don't spam the API
  }
  
  try {
    console.log('[GeoDetect] Calling geo API...');
    // Try multiple geo APIs for reliability
    let countryCode: string | undefined;
    
    // Try ipinfo.io first (HTTPS, reliable, free tier)
    try {
      const response = await fetch('https://ipinfo.io/json', {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (response.ok) {
        const data = await response.json();
        countryCode = data.country; // ipinfo.io uses 'country' field
        console.log('[GeoDetect] ipinfo.io country:', countryCode);
      }
    } catch (e) {
      console.log('[GeoDetect] ipinfo.io failed, trying backup...');
    }
    
    // Fallback to ipapi.co if first one failed
    if (!countryCode) {
      try {
        const response = await fetch('https://ipapi.co/country_code/', {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          countryCode = await response.text();
          console.log('[GeoDetect] ipapi.co country:', countryCode);
        }
      } catch (e) {
        console.log('[GeoDetect] ipapi.co also failed');
      }
    }
    
    console.log('[GeoDetect] Final country code:', countryCode);
    
    if (countryCode && countryToLanguage[countryCode]) {
      const detectedLanguage = countryToLanguage[countryCode];
      console.log('[GeoDetect] Detected language:', detectedLanguage);
      
      // Only set if it's a supported language
      if (SUPPORTED_LANGUAGES.includes(detectedLanguage)) {
        console.log('[GeoDetect] Returning language:', detectedLanguage);
        return detectedLanguage;
      }
    }
    
    console.log('[GeoDetect] No language match for country');
    // Mark as attempted if no match found (to avoid repeated API calls)
    localStorage.setItem(GEO_LANGUAGE_KEY, 'true');
    return null;
    
  } catch (error) {
    // On error, mark as attempted and fall back to browser detection
    console.warn('Geo language detection failed:', error);
    localStorage.setItem(GEO_LANGUAGE_KEY, 'true');
    return null;
  }
}
