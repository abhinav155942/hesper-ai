import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businessIntro } from '@/db/schema';
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

    const { user_name, business_description } = requestBody;

    // Validate that at least one field is provided
    if (user_name === undefined && business_description === undefined) {
      return NextResponse.json({ 
        error: "At least one field must be provided",
        code: "NO_FIELDS_PROVIDED" 
      }, { status: 400 });
    }

    // Check if record exists for this user
    const existingRecord = await db.select()
      .from(businessIntro)
      .where(eq(businessIntro.userId, parseInt(user.id)))
      .limit(1);

    let updatedRecord;
    const currentTime = new Date();
    const changedFields: { [key: string]: string } = {};

    if (existingRecord.length === 0) {
      // Insert new record
      const insertData: any = {
        userId: parseInt(user.id),
        createdAt: currentTime,
        updatedAt: currentTime
      };

      if (user_name !== undefined) {
        insertData.userName = user_name;
        changedFields.user_name = user_name;
      }
      if (business_description !== undefined) {
        insertData.businessDescription = business_description;
        changedFields.business_description = business_description;
      }

      updatedRecord = await db.insert(businessIntro)
        .values(insertData)
        .returning();
    } else {
      // Update existing record
      const updateData: any = {
        updatedAt: currentTime
      };

      if (user_name !== undefined && user_name !== existingRecord[0].userName) {
        updateData.userName = user_name;
        changedFields.user_name = user_name;
      }
      if (business_description !== undefined && business_description !== existingRecord[0].businessDescription) {
        updateData.businessDescription = business_description;
        changedFields.business_description = business_description;
      }

      // Only update if there are actual changes
      if (Object.keys(updateData).length === 1) {
        // Only updatedAt field, no actual changes
        updatedRecord = existingRecord;
      } else {
        updatedRecord = await db.update(businessIntro)
          .set(updateData)
          .where(eq(businessIntro.userId, parseInt(user.id)))
          .returning();
      }
    }

    // Send webhooks for changed fields
    const webhookUrl = 'https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/settings';
    
    for (const [fieldName, value] of Object.entries(changedFields)) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: `${fieldName}: ${value}`
        });
      } catch (webhookError) {
        console.error(`Webhook error for field ${fieldName}:`, webhookError);
        // Continue processing other webhooks even if one fails
      }
    }

    return NextResponse.json(updatedRecord[0]);

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}