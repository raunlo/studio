import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/jwt';

// Validate Google user exists and is authentic
export async function validateGoogleUser(googleUserId: string): Promise<boolean> {
  try {
    // Option 1: Use Google People API to verify user exists
    const response = await fetch(`https://people.googleapis.com/v1/people/${googleUserId}?personFields=names,emailAddresses`, {
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN}`,
      },
    });
    
    if (response.ok) {
      const userData = await response.json();
      return userData.names && userData.names.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('Google user validation failed:', error);
    return false;
  }
}

// Alternative: Validate user ID format and maintain internal user database
export function validateUserIdFormat(userId: string): boolean {
  // Google user IDs are typically 21-digit numbers
  const googleIdPattern = /^[0-9]{15,25}$/;
  return googleIdPattern.test(userId);
}

// Enhanced JWT validation middleware for backend
export async function validateUserAccess(request: NextRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  // Extract user ID from JWT
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return {
      isValid: false,
      error: 'Missing or invalid JWT token'
    };
  }
  
  // Validate user ID format
  if (!validateUserIdFormat(userId)) {
    return {
      isValid: false,
      error: 'Invalid Google user ID format'
    };
  }
  
  // Optional: Validate user exists in your database
  // const userExists = await checkUserInDatabase(userId);
  // if (!userExists) {
  //   return {
  //     isValid: false,
  //     error: 'User not found in database'
  //   };
  // }
  
  // Optional: Validate user still exists in Google (expensive operation)
  // const googleUserValid = await validateGoogleUser(userId);
  // if (!googleUserValid) {
  //   return {
  //     isValid: false,
  //     error: 'Google user no longer exists'
  //   };
  // }
  
  return {
    isValid: true,
    userId: userId
  };
}

// Example protected endpoint with enhanced validation
export async function GET(request: NextRequest) {
  const validation = await validateUserAccess(request);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error }, 
      { status: 401 }
    );
  }
  
  const userId = validation.userId!;
  
  try {
    // Your protected endpoint logic here
    // Only return data that belongs to this validated user
    
    return NextResponse.json({
      message: 'Success',
      userId: userId,
      data: {
        // User-specific data
      }
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Database user validation (implement based on your DB)
export async function checkUserInDatabase(userId: string): Promise<boolean> {
  try {
    // Example database check
    // const user = await db.users.findUnique({ where: { googleId: userId } });
    // return !!user;
    
    // For now, return true - implement your database logic
    return true;
  } catch (error) {
    console.error('Database user check failed:', error);
    return false;
  }
}
