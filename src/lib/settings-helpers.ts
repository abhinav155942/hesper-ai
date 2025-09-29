import { db } from '@/db';
import { smtpSettings, emailFormatSettings, businessIntro, businessPros, businessDifferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Individual interfaces for each settings type
export interface SmtpSettingsType {
  smtp_username: string | null;
  smtp_password: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  client_hostname: string | null;
  ssl_tls_enabled: boolean;
}

export interface EmailFormatSettingsType {
  email_tone: string | null;
  email_description: string | null;
  email_signature: string | null;
  subject_templates: string | null;
}

export interface BusinessIntroType {
  user_name: string | null;
  business_description: string | null;
}

export interface BusinessItemType {
  id: number;
  value: string;
}

// Combined settings response interface matching GET /all response
export interface UserSettingsResponse {
  smtp: SmtpSettingsType | null;
  emailFormat: EmailFormatSettingsType | null;
  businessIntro: BusinessIntroType | null;
  businessPros: BusinessItemType[];
  businessDifferences: BusinessItemType[];
}

// Helper function to get all settings as key-value lines for chat context
export async function getSettingsKeyValueLines(userId: string): Promise<string[]> {
  try {
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return [];
    }

    const lines: string[] = [];

    // Query all settings tables concurrently
    const [
      smtpResult,
      emailFormatResult,
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
    if (smtpResult.length > 0) {
      const smtp = smtpResult[0];
      if (smtp.smtpUsername !== null && smtp.smtpUsername !== undefined) {
        lines.push(`smtp_username: ${smtp.smtpUsername}`);
      }
      if (smtp.smtpPassword !== null && smtp.smtpPassword !== undefined) {
        lines.push(`smtp_password: ${smtp.smtpPassword}`);
      }
      if (smtp.smtpHost !== null && smtp.smtpHost !== undefined) {
        lines.push(`smtp_host: ${smtp.smtpHost}`);
      }
      if (smtp.smtpPort !== null && smtp.smtpPort !== undefined) {
        lines.push(`smtp_port: ${smtp.smtpPort}`);
      }
      if (smtp.clientHostname !== null && smtp.clientHostname !== undefined) {
        lines.push(`client_hostname: ${smtp.clientHostname}`);
      }
      if (smtp.sslTlsEnabled !== null && smtp.sslTlsEnabled !== undefined) {
        lines.push(`ssl_tls_enabled: ${smtp.sslTlsEnabled}`);
      }
    }

    // Process email format settings
    if (emailFormatResult.length > 0) {
      const emailFormat = emailFormatResult[0];
      if (emailFormat.emailTone !== null && emailFormat.emailTone !== undefined) {
        lines.push(`email_tone: ${emailFormat.emailTone}`);
      }
      if (emailFormat.emailDescription !== null && emailFormat.emailDescription !== undefined) {
        lines.push(`email_description: ${emailFormat.emailDescription}`);
      }
      if (emailFormat.emailSignature !== null && emailFormat.emailSignature !== undefined) {
        lines.push(`email_signature: ${emailFormat.emailSignature}`);
      }
      if (emailFormat.subjectTemplates !== null && emailFormat.subjectTemplates !== undefined) {
        lines.push(`subject_templates: ${emailFormat.subjectTemplates}`);
      }
    }

    // Process business intro settings
    if (businessIntroResult.length > 0) {
      const intro = businessIntroResult[0];
      if (intro.userName !== null && intro.userName !== undefined) {
        lines.push(`user_name: ${intro.userName}`);
      }
      if (intro.businessDescription !== null && intro.businessDescription !== undefined) {
        lines.push(`business_description: ${intro.businessDescription}`);
      }
    }

    // Process business pros (each as separate line)
    businessProsResult.forEach((pro) => {
      lines.push(`business_pro: ${pro.value}`);
    });

    // Process business differences (each as separate line)  
    businessDifferencesResult.forEach((diff) => {
      lines.push(`business_difference: ${diff.value}`);
    });

    return lines;
  } catch (error) {
    console.error('Error fetching settings for key-value lines:', error);
    return [];
  }
}

export async function getUserSettingsJson(userId: string): Promise<any> {
  try {
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return {};
    }

    const [
      smtpResult,
      emailFormatResult,
      businessIntroResult,
      businessProsResult,
      businessDifferencesResult
    ] = await Promise.all([
      db.select().from(smtpSettings).where(eq(smtpSettings.userId, userId)).limit(1),
      db.select().from(emailFormatSettings).where(eq(emailFormatSettings.userId, userIdInt)).limit(1),
      db.select().from(businessIntro).where(eq(businessIntro.userId, userIdInt)).limit(1),
      db.select().from(businessPros).where(eq(businessPros.userId, userIdInt)),
      db.select().from(businessDifferences).where(eq(businessDifferences.userId, userIdInt))
    ]);

    const smtp = smtpResult[0] || null;
    const emailFormat = emailFormatResult[0] || null;
    const businessIntroData = businessIntroResult[0] || null;

    // Split subject_templates by comma or newline if it's a string
    const subjectTemplatesArray = emailFormat?.subjectTemplates 
      ? emailFormat.subjectTemplates.split(/[,|\n]+/).map(s => s.trim()).filter(Boolean) 
      : [];

    return {
      business_intro: businessIntroData?.businessIntro || "",
      pros: businessProsResult.map((p: any) => p.value),
      differences: businessDifferencesResult.map((d: any) => d.value),
      email_format: emailFormat?.emailFormat || "",
      smtp: smtp ? {
        host: smtp.smtpHost || "",
        port: smtp.smtpPort || 587,
        username: smtp.smtpUsername || "",
        password: smtp.smtpPassword || ""
      } : null,
      email_tone: emailFormat?.emailTone || "",
      email_description: emailFormat?.emailDescription || "",
      email_signature: emailFormat?.emailSignature || "",
      subject_templates: subjectTemplatesArray,
      user_name: businessIntroData?.userName || "",
      business_description: businessIntroData?.businessDescription || ""
    };
  } catch (error) {
    console.error('Error fetching settings as JSON:', error);
    return {};
  }
}