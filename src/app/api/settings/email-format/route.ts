import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emailFormatSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
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

    // Extract allowed fields from request body
    const allowedFields = ['email_tone', 'email_description', 'email_signature', 'subject_templates'];
    const updateData: Partial<{
      emailTone: string;
      emailDescription: string;
      emailSignature: string;
      subjectTemplates: string;
    }> = {};

    // Map request fields to database column names
    const fieldMapping: Record<string, keyof typeof updateData> = {
      email_tone: 'emailTone',
      email_description: 'emailDescription',
      email_signature: 'emailSignature',
      subject_templates: 'subjectTemplates'
    };

    // Track which fields are being updated for webhook notifications
    const changedFields: Array<{ requestField: string; value: string }> = [];

    for (const [requestField, dbField] of Object.entries(fieldMapping)) {
      if (requestField in requestBody) {
        updateData[dbField] = requestBody[requestField];
        changedFields.push({ requestField, value: requestBody[requestField] });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields provided for update",
        code: "NO_FIELDS_PROVIDED" 
      }, { status: 400 });
    }

    // Check if record exists for this user
    const existingRecord = await db.select()
      .from(emailFormatSettings)
      .where(eq(emailFormatSettings.userId, parseInt(user.id)))
      .limit(1);

    let updatedRecord;

    if (existingRecord.length > 0) {
      // Update existing record
      updatedRecord = await db.update(emailFormatSettings)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(emailFormatSettings.userId, parseInt(user.id)))
        .returning();
    } else {
      // Insert new record (upsert)
      updatedRecord = await db.insert(emailFormatSettings)
        .values({
          userId: parseInt(user.id),
          ...updateData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }

    // Send webhooks for each changed field
    const webhookUrl = 'https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/settings';
    
    const webhookPromises = changedFields.map(async ({ requestField, value }) => {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: `${requestField}: ${value}`
        });
      } catch (webhookError) {
        console.error(`Webhook failed for field ${requestField}:`, webhookError);
        // Don't fail the main operation if webhook fails
      }
    });

    // Fire all webhooks concurrently but don't wait for them
    Promise.all(webhookPromises).catch(error => {
      console.error('One or more webhooks failed:', error);
    });

    return NextResponse.json(updatedRecord[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}