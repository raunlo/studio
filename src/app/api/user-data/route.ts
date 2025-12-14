import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/jwt';

// Example backend endpoint that validates user and returns user-specific data
export async function GET(request: NextRequest) {
  // Extract user ID from JWT token
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing JWT token' }, 
      { status: 401 }
    );
  }

  try {
    // Here you would:
    // 1. Validate user exists in your database
    // 2. Fetch user-specific records
    // 3. Apply proper access controls
    
    // Example response
    return NextResponse.json({
      message: 'Success',
      userId: userId,
      // Only return data that belongs to this user
      data: {
        // User's checklists, items, etc.
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

// Example for backend validation middleware
export function validateUserAccess(request: NextRequest, resourceUserId: string): boolean {
  const tokenUserId = getUserIdFromRequest(request);
  
  if (!tokenUserId) {
    return false; // No valid token
  }
  
  // Ensure user can only access their own resources
  return tokenUserId === resourceUserId;
}
