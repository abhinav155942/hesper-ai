import { NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function DELETE() {
  try {
    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Delete unverified users older than 24 hours
    const deletedUsers = await db.delete(user)
      .where(
        and(
          eq(user.emailVerified, false),
          lt(user.createdAt, twentyFourHoursAgo)
        )
      )
      .returning();

    return NextResponse.json({ 
      deleted: deletedUsers.length 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE cleanup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}