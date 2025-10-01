import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const userRecord = await db.select({
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
      credits: user.credits,
      dailyMessages: user.dailyMessages,
      dailyBasicMessages: user.dailyBasicMessages,
      dailyProMessages: user.dailyProMessages,
      basicDailyLimit: user.basicDailyLimit,
      proDailyLimit: user.proDailyLimit
    })
    .from(user)
    .where(eq(user.id, currentUser.id))
    .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      subscriptionPlan: userRecord[0].subscriptionPlan,
      subscriptionExpiry: userRecord[0].subscriptionExpiry,
      credits: userRecord[0].credits,
      dailyMessages: userRecord[0].dailyMessages,
      dailyBasicMessages: userRecord[0].dailyBasicMessages,
      dailyProMessages: userRecord[0].dailyProMessages,
      basicDailyLimit: userRecord[0].basicDailyLimit,
      proDailyLimit: userRecord[0].proDailyLimit
    });

  } catch (error) {
    console.error('GET subscription error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}