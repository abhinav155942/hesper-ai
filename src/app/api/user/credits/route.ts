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

    // Initialize testing credits for new users only if credits is null
    let credits = userRecord[0].credits;
    if (credits == null) {
      await db.update(user).set({ credits: 10 }).where(eq(user.id, currentUser.id));
      credits = 10;
    }

    // Return credits
    return NextResponse.json({
      credits
    });

  } catch (error) {
    console.error('GET /api/user/credits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}