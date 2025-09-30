import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businessPros } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const recordId = parseInt(id);

    // Check if record exists and belongs to authenticated user before deleting - use user.id as string directly
    const existingRecord = await db.select()
      .from(businessPros)
      .where(and(eq(businessPros.id, recordId), eq(businessPros.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Business pros record not found' 
      }, { status: 404 });
    }

    // Delete the record with returning to confirm deletion - use user.id as string directly
    const deleted = await db.delete(businessPros)
      .where(and(eq(businessPros.id, recordId), eq(businessPros.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete business pros record' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Business pros record deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}