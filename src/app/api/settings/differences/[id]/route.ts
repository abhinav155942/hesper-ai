import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businessDifferences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication required
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const id = params.id;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const recordId = parseInt(id);

    // Check if record exists and belongs to authenticated user - use user.id as string directly
    const existingRecord = await db.select()
      .from(businessDifferences)
      .where(and(eq(businessDifferences.id, recordId), eq(businessDifferences.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the record with user scope validation - use user.id as string directly
    const deleted = await db.delete(businessDifferences)
      .where(and(eq(businessDifferences.id, recordId), eq(businessDifferences.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete record', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Business difference deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}