import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chats, messages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const chatId = parseInt(params.id);
    if (!chatId || isNaN(chatId)) {
      return NextResponse.json({ 
        error: "Valid chat ID is required",
        code: "INVALID_CHAT_ID" 
      }, { status: 400 });
    }

    // Check if chat exists and belongs to user
    const chat = await db.select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    if (chat.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    
    let query = db.select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt
    })
    .from(messages)
    .where(and(eq(messages.chatId, chatId), eq(messages.userId, user.id)))
    .orderBy(asc(messages.createdAt));

    if (limitParam) {
      const limit = Math.min(parseInt(limitParam), 1000);
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit);
      }
    }

    const chatMessages = await query;
    return NextResponse.json(chatMessages);

  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const chatId = parseInt(params.id);
    if (!chatId || isNaN(chatId)) {
      return NextResponse.json({ 
        error: "Valid chat ID is required",
        code: "INVALID_CHAT_ID" 
      }, { status: 400 });
    }

    // Check if chat exists and belongs to user
    const chat = await db.select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    if (chat.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const requestBody = await request.json();
    
    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'chatId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID or Chat ID cannot be provided in request body",
        code: "FORBIDDEN_FIELDS" 
      }, { status: 400 });
    }

    const { role, content } = requestBody;

    // Validate required fields
    if (!role) {
      return NextResponse.json({ 
        error: "Role is required",
        code: "MISSING_ROLE" 
      }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: "Content is required and must be a non-empty string",
        code: "INVALID_CONTENT" 
      }, { status: 400 });
    }

    // Validate role values
    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json({ 
        error: "Role must be either 'user' or 'assistant'",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Insert new message
    const newMessage = await db.insert(messages)
      .values({
        chatId: chatId,
        userId: user.id,
        role: role,
        content: content.trim(),
        createdAt: new Date()
      })
      .returning({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt
      });

    // Update chat's updatedAt timestamp
    await db.update(chats)
      .set({
        updatedAt: new Date()
      })
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

    return NextResponse.json(newMessage[0], { status: 201 });

  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}