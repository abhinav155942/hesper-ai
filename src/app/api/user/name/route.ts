import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const authenticatedUser = await getCurrentUser(request);
    if (!authenticatedUser) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    // Extract and validate name
    const { name } = requestBody;

    // Validate name is present
    if (!name) {
      return NextResponse.json({ 
        error: 'Name is required' 
      }, { status: 400 });
    }

    // Validate name is string
    if (typeof name !== 'string') {
      return NextResponse.json({ 
        error: 'Name must be a string' 
      }, { status: 400 });
    }

    // Trim and validate name
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      return NextResponse.json({ 
        error: 'Name cannot be empty' 
      }, { status: 400 });
    }

    if (trimmedName.length > 80) {
      return NextResponse.json({ 
        error: 'Name cannot exceed 80 characters' 
      }, { status: 400 });
    }

    // Update user in database
    const updatedUser = await db.update(user)
      .set({
        name: trimmedName,
        updatedAt: new Date()
      })
      .where(eq(user.id, authenticatedUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({ 
      success: true, 
      name: trimmedName 
    }, { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}