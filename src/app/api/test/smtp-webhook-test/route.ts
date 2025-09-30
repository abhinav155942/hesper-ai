import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    // Simulate existing SMTP settings (what would be in database)
    const existingSettings = {
      smtpUsername: 'old@example.com',
      smtpPassword: 'oldpassword123',
      smtpHost: 'smtp.old-provider.com',
      smtpPort: 587,
      clientHostname: 'old-client.com',
      sslTlsEnabled: true,
      sendgridApiKey: 'SG.old_key_123',
      sendgridDomainEmail: 'old@sendgrid.com',
      mailgunApiKey: 'mg-old-key-456',
      mailgunDomainEmail: 'old@mailgun.com',
    };

    // Extract fields from request body that could be updated
    const {
      smtpUsername,
      smtpPassword,
      smtpHost,
      smtpPort,
      clientHostname,
      sslTlsEnabled,
      sendgridApiKey,
      sendgridDomainEmail,
      mailgunApiKey,
      mailgunDomainEmail,
    } = requestBody;

    // Simulate field change detection
    const changedFields: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      webhookUrl?: string;
    }> = [];

    // Check each field for changes
    const fieldsToCheck = [
      { field: 'smtpUsername', newValue: smtpUsername },
      { field: 'smtpPassword', newValue: smtpPassword },
      { field: 'smtpHost', newValue: smtpHost },
      { field: 'smtpPort', newValue: smtpPort },
      { field: 'clientHostname', newValue: clientHostname },
      { field: 'sslTlsEnabled', newValue: sslTlsEnabled },
      { field: 'sendgridApiKey', newValue: sendgridApiKey },
      { field: 'sendgridDomainEmail', newValue: sendgridDomainEmail },
      { field: 'mailgunApiKey', newValue: mailgunApiKey },
      { field: 'mailgunDomainEmail', newValue: mailgunDomainEmail },
    ];

    fieldsToCheck.forEach(({ field, newValue }) => {
      const oldValue = existingSettings[field as keyof typeof existingSettings];
      if (newValue !== undefined && newValue !== oldValue) {
        changedFields.push({
          field,
          oldValue,
          newValue,
          webhookUrl: `https://webhook.site/unique-id-${field}`,
        });
      }
    });

    // Generate individual field change webhooks
    const individualWebhooks = changedFields.map(({ field, oldValue, newValue, webhookUrl }) => {
      const textPayload = `Field: ${field}\nOld Value: ${oldValue}\nNew Value: ${newValue}\nTimestamp: ${new Date().toISOString()}`;
      
      const jsonPayload = {
        event: 'smtp_field_changed',
        field,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        userId: 'test-user-123',
      };

      return {
        webhookUrl,
        field,
        textFormat: {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'X-Webhook-Event': 'smtp_field_changed',
            'X-Field-Name': field,
          },
          body: textPayload,
        },
        jsonFormat: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'smtp_field_changed',
            'X-Field-Name': field,
          },
          body: jsonPayload,
        },
      };
    });

    // Generate full email config snapshot
    const updatedSettings = {
      ...existingSettings,
      ...Object.fromEntries(
        fieldsToCheck
          .filter(({ newValue }) => newValue !== undefined)
          .map(({ field, newValue }) => [field, newValue])
      ),
    };

    const fullSnapshotWebhook = {
      webhookUrl: 'https://webhook.site/unique-id-full-snapshot',
      textFormat: {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-Webhook-Event': 'email_config_snapshot',
        },
        body: `Email Configuration Snapshot
Timestamp: ${new Date().toISOString()}
User ID: test-user-123

SMTP Settings:
- Username: ${updatedSettings.smtpUsername}
- Host: ${updatedSettings.smtpHost}
- Port: ${updatedSettings.smtpPort}
- Client Hostname: ${updatedSettings.clientHostname}
- SSL/TLS Enabled: ${updatedSettings.sslTlsEnabled}

SendGrid Settings:
- API Key: ${updatedSettings.sendgridApiKey ? '***' + updatedSettings.sendgridApiKey.slice(-4) : 'Not set'}
- Domain Email: ${updatedSettings.sendgridDomainEmail}

Mailgun Settings:
- API Key: ${updatedSettings.mailgunApiKey ? '***' + updatedSettings.mailgunApiKey.slice(-4) : 'Not set'}
- Domain Email: ${updatedSettings.mailgunDomainEmail}`,
      },
      jsonFormat: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'email_config_snapshot',
        },
        body: {
          event: 'email_config_snapshot',
          timestamp: new Date().toISOString(),
          userId: 'test-user-123',
          emailConfig: {
            smtp: {
              username: updatedSettings.smtpUsername,
              host: updatedSettings.smtpHost,
              port: updatedSettings.smtpPort,
              clientHostname: updatedSettings.clientHostname,
              sslTlsEnabled: updatedSettings.sslTlsEnabled,
            },
            sendgrid: {
              apiKey: updatedSettings.sendgridApiKey ? '***' + updatedSettings.sendgridApiKey.slice(-4) : null,
              domainEmail: updatedSettings.sendgridDomainEmail,
            },
            mailgun: {
              apiKey: updatedSettings.mailgunApiKey ? '***' + updatedSettings.mailgunApiKey.slice(-4) : null,
              domainEmail: updatedSettings.mailgunDomainEmail,
            },
          },
        },
      },
    };

    // Response with all webhook information
    const response = {
      testResults: {
        message: 'SMTP webhook test simulation completed',
        fieldsDetected: changedFields.length,
        webhooksGenerated: changedFields.length + 1, // individual + snapshot
      },
      simulatedExistingSettings: existingSettings,
      requestedUpdates: requestBody,
      detectedChanges: changedFields.map(({ field, oldValue, newValue }) => ({
        field,
        oldValue,
        newValue,
        changed: true,
      })),
      webhooksToSend: {
        individualFieldChanges: individualWebhooks,
        fullConfigSnapshot: fullSnapshotWebhook,
      },
      summary: {
        totalWebhooksCalled: individualWebhooks.length + 1,
        individualFieldWebhooks: individualWebhooks.length,
        snapshotWebhooks: 1,
        changedFields: changedFields.map(f => f.field),
        webhookUrls: [
          ...individualWebhooks.map(w => w.webhookUrl),
          fullSnapshotWebhook.webhookUrl,
        ],
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}