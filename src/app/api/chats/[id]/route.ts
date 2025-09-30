import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const chat = await db.select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt
    })
    .from(chats)
    .where(and(eq(chats.id, parseInt(id)), eq(chats.userId, user.id)))
    .limit(1);

    if (chat.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat[0]);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { title } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if chat exists and belongs to user
    const existingChat = await db.select()
      .from(chats)
      .where(and(eq(chats.id, parseInt(id)), eq(chats.userId, user.id)))
      .limit(1);

    if (existingChat.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) {
      updates.title = title;
    }

    const updated = await db.update(chats)
      .set(updates)
      .where(and(eq(chats.id, parseInt(id)), eq(chats.userId, user.id)))
      .returning({
        id: chats.id,
        title: chats.title
      });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if chat exists and belongs to user before deleting
    const existingChat = await db.select()
      .from(chats)
      .where(and(eq(chats.id, parseInt(id)), eq(chats.userId, user.id)))
      .limit(1);

    if (existingChat.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const deleted = await db.delete(chats)
      .where(and(eq(chats.id, parseInt(id)), eq(chats.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}