import { db } from '@/db';
import { smtpSettings } from '@/db/schema';

async function main() {
    const sampleSmtpSettings = [
        {
            userId: '999',
            smtpUsername: 'business.dev@gmail.com',
            smtpPassword: 'app_password_gmail_2024',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            clientHostname: 'gmail.com',
            sslTlsEnabled: true,
            createdAt: new Date('2024-01-15T10:30:00Z'),
            updatedAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
            userId: '999',
            smtpUsername: 'support@outlook.com',
            smtpPassword: 'outlook_secure_pass_2024',
            smtpHost: 'smtp-mail.outlook.com',
            smtpPort: 587,
            clientHostname: 'outlook.com',
            sslTlsEnabled: true,
            createdAt: new Date('2024-01-20T14:45:00Z'),
            updatedAt: new Date('2024-01-20T14:45:00Z'),
        },
        {
            userId: '999',
            smtpUsername: 'noreply@mycompany.com',
            smtpPassword: 'custom_domain_smtp_2024',
            smtpHost: 'mail.mycompany.com',
            smtpPort: 465,
            clientHostname: 'mycompany.com',
            sslTlsEnabled: true,
            createdAt: new Date('2024-02-01T09:15:00Z'),
            updatedAt: new Date('2024-02-01T09:15:00Z'),
        }
    ];

    await db.insert(smtpSettings).values(sampleSmtpSettings);
    
    console.log('✅ SMTP Settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});