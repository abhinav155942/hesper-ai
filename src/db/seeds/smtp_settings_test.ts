import { db } from '@/db';
import { smtpSettings } from '@/db/schema';

async function main() {
    const sampleSmtpSettings = [
        {
            userId: 999,
            smtpUsername: 'testuser@gmail.com',
            smtpPassword: 'encrypted_password_123',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            clientHostname: 'mail.testdomain.com',
            sslTlsEnabled: true,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
        },
        {
            userId: 999,
            smtpUsername: 'testuser@outlook.com',
            smtpPassword: 'encrypted_password_123',
            smtpHost: 'smtp-mail.outlook.com',
            smtpPort: 587,
            clientHostname: 'mail.business.com',
            sslTlsEnabled: true,
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-20'),
        },
        {
            userId: 999,
            smtpUsername: 'admin@customdomain.com',
            smtpPassword: 'encrypted_password_123',
            smtpHost: 'mail.customdomain.com',
            smtpPort: 465,
            clientHostname: 'smtp.customdomain.com',
            sslTlsEnabled: true,
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-02-01'),
        }
    ];

    await db.insert(smtpSettings).values(sampleSmtpSettings);
    
    console.log('✅ SMTP settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});