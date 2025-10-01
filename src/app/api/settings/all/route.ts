import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  smtpSettings, 
  emailFormatSettings, 
  businessIntro, 
  businessPros, 
  businessDifferences,
  user
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Add validation for user.id
    if (!currentUser.id || typeof currentUser.id !== 'string') {
      console.error('Invalid user ID:', currentUser.id);
      return NextResponse.json({ 
        error: 'Invalid authentication' 
      }, { status: 401 });
    }

    const userId = currentUser.id;

    // Query all settings tables concurrently for the authenticated user
    const [
      smtpResult,
      emailFormatResult,
      businessIntroResult,
      businessProsResult,
      businessDifferencesResult,
      userResult
    ] = await Promise.all([
      // SMTP Settings
      db.select({
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
      })
        .from(smtpSettings)
        .where(eq(smtpSettings.userId, userId))
        .limit(1),

      // Email Format Settings
      db.select({
        email_tone: emailFormatSettings.emailTone,
        email_description: emailFormatSettings.emailDescription,
        email_signature: emailFormatSettings.emailSignature,
        subject_templates: emailFormatSettings.subjectTemplates,
        email_format: emailFormatSettings.emailFormat
      })
        .from(emailFormatSettings)
        .where(eq(emailFormatSettings.userId, userId))
        .limit(1),

      // Business Intro
      db.select({
        user_name: businessIntro.userName,
        business_description: businessIntro.businessDescription,
        business_intro: businessIntro.businessIntro
      })
        .from(businessIntro)
        .where(eq(businessIntro.userId, userId))
        .limit(1),

      // Business Pros
      db.select({
        id: businessPros.id,
        value: businessPros.value
      })
        .from(businessPros)
        .where(eq(businessPros.userId, userId)),

      // Business Differences
      db.select({
        id: businessDifferences.id,
        value: businessDifferences.value
      })
        .from(businessDifferences)
        .where(eq(businessDifferences.userId, userId)),

      // User email provider settings
      db.select({
        sendgrid_api_key: user.sendgridApiKey,
        sendgrid_domain: user.sendgridDomain, 
        mailgun_api_key: user.mailgunApiKey,
        mailgun_domain: user.mailgunDomain,
        email_provider: user.emailProvider
      })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
    ]);

    // Flatten the response to match frontend expectations
    const smtpData = smtpResult[0] || {};
    const emailData = emailFormatResult[0] || {};
    const businessData = businessIntroResult[0] || {};
    const userData = userResult[0] || {};

    const response = {
      // SMTP fields
      smtp_username: smtpData.smtp_username || null,
      smtp_password: null, // Never return password
      smtp_host: smtpData.smtp_host || null,
      smtp_port: smtpData.smtp_port || null,
      client_hostname: smtpData.client_hostname || null,
      ssl_tls_enabled: smtpData.ssl_tls_enabled || false,
      sendgrid_api_key: smtpData.sendgrid_api_key || null, // Now return actual API key for user settings
      sendgrid_domain_email: smtpData.sendgrid_domain_email || null,
      mailgun_api_key: smtpData.mailgun_api_key || null, // Now return actual API key for user settings
      mailgun_domain_email: smtpData.mailgun_domain_email || null,
      // Email format fields
      email_tone: emailData.email_tone || null,
      email_description: emailData.email_description || null,
      email_signature: emailData.email_signature || null,
      subject_templates: emailData.subject_templates || null,
      email_format: emailData.email_format || null,
      // Business intro fields
      user_name: businessData.user_name || null,
      business_description: businessData.business_description || null,
      business_intro: businessData.business_intro || null,
      // Lists
      business_pros: businessProsResult || [],
      business_differences: businessDifferencesResult || [],
      // Email provider fields from user table
      email_provider: userData.email_provider || null
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET /api/settings/all error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}