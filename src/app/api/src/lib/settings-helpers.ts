import { db } from '@/db';
import { smtpSettings, emailFormatSettings, businessIntro, businessPros, businessDifferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Individual interfaces for each settings type
export interface SmtpSettings {
  id: number;
  userId: number;
  smtpUsername: string | null;
  smtpPassword: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  clientHostname: string | null;
  sslTlsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailFormatSettings {
  id: number;
  userId: number;
  emailTone: string | null;
  emailDescription: string | null;
  emailSignature: string | null;
  subjectTemplates: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessIntro {
  id: number;
  userId: number;
  userName: string | null;
  businessDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessPro {
  id: number;
  userId: number;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessDifference {
  id: number;
  userId: number;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// Combined settings response interface
export interface UserSettingsResponse {
  smtpSettings: SmtpSettings | null;
  emailFormatSettings: EmailFormatSettings | null;
  businessIntro: BusinessIntro | null;
  businessPros: BusinessPro[];
  businessDifferences: BusinessDifference[];
}

// Helper function to get all settings as key-value lines
export async function getSettingsKeyValueLines(userId: string): Promise<string[]> {
  try {
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return [];
    }

    const lines: string[] = [];

    // Query all settings tables
    const [
      smtpSettingsResult,
      emailFormatSettingsResult,
      businessIntroResult,
      businessProsResult,
      businessDifferencesResult
    ] = await Promise.all([
      db.select().from(smtpSettings).where(eq(smtpSettings.userId, userIdInt)).limit(1),
      db.select().from(emailFormatSettings).where(eq(emailFormatSettings.userId, userIdInt)).limit(1),
      db.select().from(businessIntro).where(eq(businessIntro.userId, userIdInt)).limit(1),
      db.select().from(businessPros).where(eq(businessPros.userId, userIdInt)),
      db.select().from(businessDifferences).where(eq(businessDifferences.userId, userIdInt))
    ]);

    // Process SMTP settings
    if (smtpSettingsResult.length > 0) {
      const smtp = smtpSettingsResult[0];
      if (smtp.smtpUsername !== null) lines.push(`smtp_username: ${smtp.smtpUsername}`);
      if (smtp.smtpPassword !== null) lines.push(`smtp_password: ${smtp.smtpPassword}`);
      if (smtp.smtpHost !== null) lines.push(`smtp_host: ${smtp.smtpHost}`);
      if (smtp.smtpPort !== null) lines.push(`smtp_port: ${smtp.smtpPort}`);
      if (smtp.clientHostname !== null) lines.push(`client_hostname: ${smtp.clientHostname}`);
      lines.push(`ssl_tls_enabled: ${smtp.sslTlsEnabled}`);
    }

    // Process email format settings
    if (emailFormatSettingsResult.length > 0) {
      const emailFormat = emailFormatSettingsResult[0];
      if (emailFormat.emailTone !== null) lines.push(`email_tone: ${emailFormat.emailTone}`);
      if (emailFormat.emailDescription !== null) lines.push(`email_description: ${emailFormat.emailDescription}`);
      if (emailFormat.emailSignature !== null) lines.push(`email_signature: ${emailFormat.emailSignature}`);
      if (emailFormat.subjectTemplates !== null) lines.push(`subject_templates: ${emailFormat.subjectTemplates}`);
    }

    // Process business intro settings
    if (businessIntroResult.length > 0) {
      const intro = businessIntroResult[0];
      if (intro.userName !== null) lines.push(`user_name: ${intro.userName}`);
      if (intro.businessDescription !== null) lines.push(`business_description: ${intro.businessDescription}`);
    }

    // Process business pros
    businessProsResult.forEach((pro, index) => {
      lines.push(`business_pro_${index + 1}: ${pro.value}`);
    });

    // Process business differences
    businessDifferencesResult.forEach((diff, index) => {
      lines.push(`business_difference_${index + 1}: ${diff.value}`);
    });

    return lines;
  } catch (error) {
    console.error('Error fetching settings for key-value lines:', error);
    return [];
  }
}