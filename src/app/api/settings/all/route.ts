import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  smtpSettings, 
  emailFormatSettings, 
  businessIntro, 
  businessPros, 
  businessDifferences 
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Query all settings tables concurrently for the authenticated user
    const [
      smtpResult,
      emailFormatResult,
      businessIntroResult,
      businessProsResult,
      businessDifferencesResult
    ] = await Promise.all([
      // SMTP Settings (single record)
      db.select({
        smtp_username: smtpSettings.smtpUsername,
        smtp_password: smtpSettings.smtpPassword,
        smtp_host: smtpSettings.smtpHost,
        smtp_port: smtpSettings.smtpPort,
        client_hostname: smtpSettings.clientHostname,
        ssl_tls_enabled: smtpSettings.sslTlsEnabled
      })
        .from(smtpSettings)
        .where(eq(smtpSettings.userId, parseInt(user.id)))
        .limit(1),

      // Email Format Settings (single record)
      db.select({
        email_tone: emailFormatSettings.emailTone,
        email_description: emailFormatSettings.emailDescription,
        email_signature: emailFormatSettings.emailSignature,
        subject_templates: emailFormatSettings.subjectTemplates
      })
        .from(emailFormatSettings)
        .where(eq(emailFormatSettings.userId, parseInt(user.id)))
        .limit(1),

      // Business Intro (single record)
      db.select({
        user_name: businessIntro.userName,
        business_description: businessIntro.businessDescription
      })
        .from(businessIntro)
        .where(eq(businessIntro.userId, parseInt(user.id)))
        .limit(1),

      // Business Pros (multiple records)
      db.select({
        id: businessPros.id,
        value: businessPros.value
      })
        .from(businessPros)
        .where(eq(businessPros.userId, parseInt(user.id))),

      // Business Differences (multiple records)
      db.select({
        id: businessDifferences.id,
        value: businessDifferences.value
      })
        .from(businessDifferences)
        .where(eq(businessDifferences.userId, parseInt(user.id)))
    ]);

    // Format response according to requirements
    const response = {
      smtp: smtpResult.length > 0 ? smtpResult[0] : null,
      emailFormat: emailFormatResult.length > 0 ? emailFormatResult[0] : null,
      businessIntro: businessIntroResult.length > 0 ? businessIntroResult[0] : null,
      businessPros: businessProsResult || [],
      businessDifferences: businessDifferencesResult || []
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET /api/settings/all error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}