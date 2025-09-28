import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required. Please login to continue.',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Parse request body
    const requestBody = await request.json();
    const { amount } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate amount field
    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (typeof amount !== 'number') {
      return NextResponse.json({ 
        error: "Amount must be a number",
        code: "INVALID_AMOUNT_TYPE" 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: "Amount must be a positive number",
        code: "INVALID_AMOUNT_VALUE" 
      }, { status: 400 });
    }

    if (!Number.isInteger(amount)) {
      return NextResponse.json({ 
        error: "Amount must be a whole number",
        code: "INVALID_AMOUNT_FORMAT" 
      }, { status: 400 });
    }

    // Get current user record to calculate new credits
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    const currentCredits = existingUser[0].credits || 0;
    const newCreditsTotal = currentCredits + amount;

    // Update user's credits
    const updatedUser = await db.update(user)
      .set({
        credits: newCreditsTotal,
        updatedAt: new Date()
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: "Failed to update user credits",
        code: "UPDATE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json(updatedUser[0], { status: 200 });

  } catch (error) {
    console.error('POST /api/credits error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}