import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Minimal JWT payload with only user ID
export interface JWTPayload {
  sub: string; // subject - user ID only
  iat: number; // issued at
  exp: number; // expires at
}

export function generateUserJWT(user: UserPayload): string {
  // Validate that user has required Google fields before generating JWT
  if (!user.id || !user.email || !user.name) {
    throw new Error('Invalid user data: missing required Google fields');
  }
  
  // Ensure user ID looks like a Google ID (basic format check)
  if (!user.id.match(/^[0-9]+$/) && !user.id.includes('google')) {
    throw new Error('Invalid Google user ID format');
  }
  
  return jwt.sign(
    {
      sub: user.id, // Only user ID in JWT
      iat: Math.floor(Date.now() / 1000), // issued at
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // expires in 24 hours
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

export function verifyUserJWT(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return {
      userId: decoded.sub, // Only return user ID
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function getUserIdFromRequest(request: Request): string | null {
  // Get token from HTTP-only cookie instead of Authorization header
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }
  
  // Parse auth_token from cookie string
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));
  if (!authCookie) {
    return null;
  }
  
  const token = authCookie.substring(11); // Remove "auth_token=" prefix
  const result = verifyUserJWT(token);
  return result ? result.userId : null;
}
