import { db } from '@/db';
import { smtpSettings } from '@/db/schema';

async function main() {
    const sampleSmtpSettings = [
        {
            userId: '999',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUsername: 'test@gmail.com',
            smtpPassword: 'gmail_app_password_123',
            clientHostname: 'localhost',
            sslTlsEnabled: true,
            sendgridApiKey: 'SG.test_key_123',
            sendgridDomainEmail: 'noreply@testdomain.com',
            mailgunApiKey: null,
            mailgunDomainEmail: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
            userId: '999',
            smtpHost: 'smtp-mail.outlook.com',
            smtpPort: 587,
            smtpUsername: 'test@outlook.com',
            smtpPassword: 'outlook_password_456',
            clientHostname: 'localhost',
            sslTlsEnabled: true,
            sendgridApiKey: null,
            sendgridDomainEmail: null,
            mailgunApiKey: 'mg_test_key_456',
            mailgunDomainEmail: 'support@testdomain.com',
            createdAt: new Date('2024-01-16T14:30:00Z'),
            updatedAt: new Date('2024-01-16T14:30:00Z'),
        },
        {
            userId: '999',
            smtpHost: null,
            smtpPort: null,
            smtpUsername: null,
            smtpPassword: null,
            clientHostname: null,
            sslTlsEnabled: false,
            sendgridApiKey: 'SG.dual_key_789',
            sendgridDomainEmail: 'info@dualdomain.com',
            mailgunApiKey: 'mg_dual_key_999',
            mailgunDomainEmail: 'alerts@dualdomain.com',
            createdAt: new Date('2024-01-17T09:15:00Z'),
            updatedAt: new Date('2024-01-17T09:15:00Z'),
        }
    ];

    await db.insert(smtpSettings).values(sampleSmtpSettings);
    
    console.log('✅ SMTP settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});