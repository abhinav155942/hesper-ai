import { db } from '@/db';
import { smtpSettings } from '@/db/schema';

async function main() {
    const sampleSmtpSettings = [
        {
            userId: '999',
            smtpUsername: 'business@gmail.com',
            smtpPassword: 'gmail_app_password_123',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            clientHostname: 'gmail-business.com',
            sslTlsEnabled: true,
            sendgridApiKey: 'SG.test_gmail_key',
            sendgridDomainEmail: 'noreply@gmail-business.com',
            mailgunApiKey: null,
            mailgunDomainEmail: null,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            userId: '999',
            smtpUsername: 'support@outlook-business.com',
            smtpPassword: 'outlook_secure_pass_456',
            smtpHost: 'smtp-mail.outlook.com',
            smtpPort: 587,
            clientHostname: 'outlook-business.com',
            sslTlsEnabled: true,
            sendgridApiKey: null,
            sendgridDomainEmail: null,
            mailgunApiKey: 'mg_outlook_key',
            mailgunDomainEmail: 'support@outlook-business.com',
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: '999',
            smtpUsername: 'admin@company.com',
            smtpPassword: 'company_smtp_789',
            smtpHost: 'mail.company.com',
            smtpPort: 465,
            clientHostname: 'company.com',
            sslTlsEnabled: true,
            sendgridApiKey: 'SG.company_key',
            sendgridDomainEmail: 'hello@company.com',
            mailgunApiKey: 'mg_company_key',
            mailgunDomainEmail: 'info@company.com',
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
        {
            userId: '999',
            smtpUsername: null,
            smtpPassword: null,
            smtpHost: null,
            smtpPort: null,
            clientHostname: null,
            sslTlsEnabled: false,
            sendgridApiKey: 'SG.sendgrid_only_key',
            sendgridDomainEmail: 'marketing@sendgrid-only.com',
            mailgunApiKey: null,
            mailgunDomainEmail: null,
            createdAt: new Date('2024-01-25').toISOString(),
            updatedAt: new Date('2024-01-25').toISOString(),
        },
        {
            userId: '999',
            smtpUsername: null,
            smtpPassword: null,
            smtpHost: null,
            smtpPort: null,
            clientHostname: null,
            sslTlsEnabled: false,
            sendgridApiKey: null,
            sendgridDomainEmail: null,
            mailgunApiKey: 'mg_mailgun_only_key',
            mailgunDomainEmail: 'notifications@mailgun-only.com',
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-02-01').toISOString(),
        }
    ];

    await db.insert(smtpSettings).values(sampleSmtpSettings);
    
    console.log('✅ SMTP settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});