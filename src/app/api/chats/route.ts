import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userChats = await db.select({
      id: chats.id,
      title: chats.title,
      updatedAt: chats.updatedAt
    })
    .from(chats)
    .where(eq(chats.userId, user.id))
    .orderBy(desc(chats.updatedAt));

    return NextResponse.json(userChats);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    
    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { title } = requestBody;

    const currentTime = new Date();
    
    const newChat = await db.insert(chats)
      .values({
        userId: user.id,
        title: title || null,
        createdAt: currentTime,
        updatedAt: currentTime
      })
      .returning({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt
      });

    return NextResponse.json(newChat[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}