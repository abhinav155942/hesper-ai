import { db } from '@/db';
import { emailFormatSettings } from '@/db/schema';

async function main() {
    const sampleEmailFormatSettings = [
        {
            userId: '999',
            emailTone: 'professional',
            emailDescription: 'Professional business communications with clear call-to-actions and structured content for corporate clients and partners.',
            emailSignature: 'Best regards,\nJohn Smith\nSenior Account Manager\nABC Corporation\nPhone: (555) 123-4567\nEmail: john.smith@abccorp.com',
            subjectTemplates: 'Follow-up on {meeting_topic} | {product_name} - Next Steps | Proposal for {client_name} | Weekly Update - {date}',
            emailFormat: 'HTML',
            createdAt: new Date('2024-01-15T10:30:00Z').getTime(),
            updatedAt: new Date('2024-01-15T10:30:00Z').getTime(),
        },
        {
            userId: 'test-user-123',
            emailTone: 'friendly',
            emailDescription: 'Warm and approachable email style for customer support and client relationship building with personalized touches.',
            emailSignature: 'Thanks for your time!\nSarah Johnson\nCustomer Success Specialist\nXYZ Solutions\n📞 (555) 987-6543\n✉️ sarah@xyzsolutions.com\n🌐 www.xyzsolutions.com',
            subjectTemplates: 'Great to connect, {client_name}! | Thanks for your interest in {product_name} | Quick check-in 👋 | Your {service_name} is ready!',
            emailFormat: 'Plain Text',
            createdAt: new Date('2024-02-01T14:15:00Z').getTime(),
            updatedAt: new Date('2024-02-01T14:15:00Z').getTime(),
        }
    ];

    await db.insert(emailFormatSettings).values(sampleEmailFormatSettings);
    
    console.log('✅ Email format settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});