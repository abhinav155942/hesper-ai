import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { smtpSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET handler for SMTP settings with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ 
        error: 'Limit must be a positive integer',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: 'Offset must be a non-negative integer',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }

    // Query SMTP settings with all columns, pagination, and ordering
    const smtpRecords = await db.select({
      id: smtpSettings.id,
      user_id: smtpSettings.userId,
      smtp_username: smtpSettings.smtpUsername,
      smtp_password: smtpSettings.smtpPassword,
      smtp_host: smtpSettings.smtpHost,
      smtp_port: smtpSettings.smtpPort,
      client_hostname: smtpSettings.clientHostname,
      ssl_tls_enabled: smtpSettings.sslTlsEnabled,
      sendgrid_api_key: smtpSettings.sendgridApiKey,
      sendgrid_domain_email: smtpSettings.sendgridDomainEmail,
      mailgun_api_key: smtpSettings.mailgunApiKey,
      mailgun_domain_email: smtpSettings.mailgunDomainEmail,
      created_at: smtpSettings.createdAt,
      updated_at: smtpSettings.updatedAt
    })
      .from(smtpSettings)
      .where(eq(smtpSettings.userId, user.id))
      .orderBy(smtpSettings.id) // Order by id ASC
      .limit(limit)
      .offset(offset);

    return NextResponse.json(smtpRecords, { status: 200 });

  } catch (error) {
    console.error('GET /api/settings/smtp error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}

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

    const {
      smtp_username,
      smtp_password,
      smtp_host,
      smtp_port,
      client_hostname,
      ssl_tls_enabled,
      sendgrid_api_key,
      sendgrid_domain_email,
      mailgun_api_key,
      mailgun_domain_email
    } = requestBody;

    // Validate smtp_port is integer if provided
    if (smtp_port !== undefined && (!Number.isInteger(smtp_port) || smtp_port < 1 || smtp_port > 65535)) {
      return NextResponse.json({
        error: "smtp_port must be a valid integer between 1 and 65535",
        code: "INVALID_SMTP_PORT"
      }, { status: 400 });
    }

    // Validate ssl_tls_enabled is boolean if provided
    if (ssl_tls_enabled !== undefined && typeof ssl_tls_enabled !== 'boolean') {
      return NextResponse.json({
        error: "ssl_tls_enabled must be a boolean value",
        code: "INVALID_SSL_TLS_ENABLED"
      }, { status: 400 });
    }

    // Check if record exists for this user
    const existingRecord = await db.select()
      .from(smtpSettings)
      .where(eq(smtpSettings.userId, user.id))
      .limit(1);

    const updateData: any = {
      updatedAt: new Date()
    };

    // Track changed fields for webhooks
    const changedFields: { [key: string]: any } = {};

    // Only include provided fields in update
    if (smtp_username !== undefined) {
      updateData.smtpUsername = smtp_username;
      changedFields.smtp_username = smtp_username;
    }
    if (smtp_password !== undefined) {
      updateData.smtpPassword = smtp_password;
      changedFields.smtp_password = smtp_password;
    }
    if (smtp_host !== undefined) {
      updateData.smtpHost = smtp_host;
      changedFields.smtp_host = smtp_host;
    }
    if (smtp_port !== undefined) {
      updateData.smtpPort = smtp_port;
      changedFields.smtp_port = smtp_port;
    }
    if (client_hostname !== undefined) {
      updateData.clientHostname = client_hostname;
      changedFields.client_hostname = client_hostname;
    }
    if (ssl_tls_enabled !== undefined) {
      updateData.sslTlsEnabled = ssl_tls_enabled;
      changedFields.ssl_tls_enabled = ssl_tls_enabled;
    }
    if (sendgrid_api_key !== undefined) {
      updateData.sendgridApiKey = sendgrid_api_key;
      changedFields.sendgrid_api_key = sendgrid_api_key;
    }
    if (sendgrid_domain_email !== undefined) {
      updateData.sendgridDomainEmail = sendgrid_domain_email;
      changedFields.sendgrid_domain_email = sendgrid_domain_email;
    }
    if (mailgun_api_key !== undefined) {
      updateData.mailgunApiKey = mailgun_api_key;
      changedFields.mailgun_api_key = mailgun_api_key;
    }
    if (mailgun_domain_email !== undefined) {
      updateData.mailgunDomainEmail = mailgun_domain_email;
      changedFields.mailgun_domain_email = mailgun_domain_email;
    }

    let result;

    if (existingRecord.length > 0) {
      // Update existing record
      result = await db.update(smtpSettings)
        .set(updateData)
        .where(eq(smtpSettings.userId, user.id))
        .returning();
    } else {
      // Insert new record
      const insertData = {
        userId: user.id,
        smtpUsername: smtp_username || null,
        smtpPassword: smtp_password || null,
        smtpHost: smtp_host || null,
        smtpPort: smtp_port || null,
        clientHostname: client_hostname || null,
        sslTlsEnabled: ssl_tls_enabled !== undefined ? ssl_tls_enabled : false,
        sendgridApiKey: sendgrid_api_key || null,
        sendgridDomainEmail: sendgrid_domain_email || null,
        mailgunApiKey: mailgun_api_key || null,
        mailgunDomainEmail: mailgun_domain_email || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      result = await db.insert(smtpSettings)
        .values(insertData)
        .returning();
    }

    // Send webhooks for each changed field
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

    // Send full email configs snapshot when any email config changes
    if (Object.keys(changedFields).length > 0) {
      try {
        const updatedRecord = result[0];
        const emailConfigsSnapshot = {
          email_configs: {
            smtp_username: updatedRecord.smtpUsername || null,
            smtp_password: updatedRecord.smtpPassword || null,
            smtp_host: updatedRecord.smtpHost || null,
            smtp_port: updatedRecord.smtpPort || null,
            client_hostname: updatedRecord.clientHostname || null,
            ssl_tls_enabled: updatedRecord.sslTlsEnabled || false,
            sendgrid_api_key: updatedRecord.sendgridApiKey || null,
            sendgrid_domain_email: updatedRecord.sendgridDomainEmail || null,
            mailgun_api_key: updatedRecord.mailgunApiKey || null,
            mailgun_domain_email: updatedRecord.mailgunDomainEmail || null
          }
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailConfigsSnapshot)
        });
      } catch (snapshotWebhookError) {
        console.error('Email configs snapshot webhook error:', snapshotWebhookError);
      }
    }

    return NextResponse.json(result[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}