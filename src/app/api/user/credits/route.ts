import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please login to continue.' },
        { status: 401 }
      );
    }

    // Query user table to get credits
    const userRecord = await db
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    // Check if user exists
    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return credits
    return NextResponse.json({
      credits: userRecord[0].credits
    });

  } catch (error) {
    console.error('GET /api/credits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}