import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businessPros } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const requestBody = await request.json();
    const { value } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!value) {
      return NextResponse.json({ 
        error: "Value is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate value is non-empty string
    if (typeof value !== 'string' || value.trim().length === 0) {
      return NextResponse.json({ 
        error: "Value must be a non-empty string",
        code: "INVALID_VALUE" 
      }, { status: 400 });
    }

    // Create new business_pros record - use user.id as string directly
    const newBusinessPro = await db.insert(businessPros)
      .values({
        userId: user.id,
        value: value.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Send webhook after successful DB write
    try {
      const webhookUrl = 'https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/settings';
      const webhookBody = `business_pro: ${value.trim()}`;
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: webhookBody,
      });
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
      // Continue execution even if webhook fails
    }

    return NextResponse.json(newBusinessPro[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}