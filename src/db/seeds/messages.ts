import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const sampleMessages = [
        // Chat ID 1 (userId '999'): "Getting started with our platform" - onboarding questions
        {
            chatId: 1,
            userId: '999',
            role: 'user',
            content: 'Hi! I just signed up for your platform and I\'m not sure where to start. Can you help me get oriented?',
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            chatId: 1,
            userId: '999',
            role: 'assistant',
            content: 'Welcome to our platform! I\'d be happy to help you get started. First, I recommend completing your profile setup in the Settings section. Then, check out our Quick Start Guide in the Help menu. What specific feature are you most interested in learning about?',
            createdAt: new Date('2024-01-15T10:01:00Z').toISOString(),
        },
        {
            chatId: 1,
            userId: '999',
            role: 'user',
            content: 'I\'m mainly interested in the email automation features. How do I set that up?',
            createdAt: new Date('2024-01-15T10:02:00Z').toISOString(),
        },
        {
            chatId: 1,
            userId: '999',
            role: 'assistant',
            content: 'Great choice! To set up email automation, go to Settings > SMTP Settings and configure your email server details. Then visit Email Format Settings to customize your templates and tone. Once that\'s done, you can start creating automated campaigns from the main dashboard.',
            createdAt: new Date('2024-01-15T10:03:00Z').toISOString(),
        },

        // Chat ID 2 (userId 'test-user-123'): "Technical support inquiry" - technical problems
        {
            chatId: 2,
            userId: 'test-user-123',
            role: 'user',
            content: 'I\'m having trouble connecting my SMTP server. I keep getting a connection timeout error. Can you help?',
            createdAt: new Date('2024-01-16T14:30:00Z').toISOString(),
        },
        {
            chatId: 2,
            userId: 'test-user-123',
            role: 'assistant',
            content: 'I can help you troubleshoot this SMTP connection issue. First, please verify that your SMTP host and port settings are correct. Common ports are 587 for TLS or 465 for SSL. Also, make sure your firewall isn\'t blocking outbound connections on these ports.',
            createdAt: new Date('2024-01-16T14:32:00Z').toISOString(),
        },
        {
            chatId: 2,
            userId: 'test-user-123',
            role: 'user',
            content: 'I\'m using Gmail with port 587 and TLS enabled. The settings look correct to me.',
            createdAt: new Date('2024-01-16T14:35:00Z').toISOString(),
        },
        {
            chatId: 2,
            userId: 'test-user-123',
            role: 'assistant',
            content: 'For Gmail, make sure you\'re using an App Password instead of your regular password, especially if you have 2FA enabled. Also, verify that "Less secure app access" is enabled in your Google account settings. Try smtp.gmail.com as the host if you haven\'t already.',
            createdAt: new Date('2024-01-16T14:36:00Z').toISOString(),
        },
        {
            chatId: 2,
            userId: 'test-user-123',
            role: 'user',
            content: 'That worked! The app password was the issue. Thank you so much!',
            createdAt: new Date('2024-01-16T14:40:00Z').toISOString(),
        },

        // Chat ID 3 (userId 'pro-test-user-456'): "Billing and subscription questions" - billing issues
        {
            chatId: 3,
            userId: 'pro-test-user-456',
            role: 'user',
            content: 'I upgraded to the Pro plan yesterday but my account still shows the free plan. When will the upgrade take effect?',
            createdAt: new Date('2024-01-18T09:15:00Z').toISOString(),
        },
        {
            chatId: 3,
            userId: 'pro-test-user-456',
            role: 'assistant',
            content: 'Thanks for upgrading to Pro! Typically, plan upgrades are processed immediately. Let me check your account status. In the meantime, can you confirm the email address associated with your payment method matches your account email?',
            createdAt: new Date('2024-01-18T09:17:00Z').toISOString(),
        },
        {
            chatId: 3,
            userId: 'pro-test-user-456',
            role: 'user',
            content: 'Yes, the email addresses match. I can see the charge on my credit card, but my dashboard still shows "Free Plan" with 0 credits.',
            createdAt: new Date('2024-01-18T09:20:00Z').toISOString(),
        },
        {
            chatId: 3,
            userId: 'pro-test-user-456',
            role: 'assistant',
            content: 'I see the issue - there was a sync delay in our billing system. I\'ve manually updated your account to Pro status and added your 1000 monthly credits. Please log out and back in to see the changes. You should also receive a confirmation email shortly.',
            createdAt: new Date('2024-01-18T09:22:00Z').toISOString(),
        },
        {
            chatId: 3,
            userId: 'pro-test-user-456',
            role: 'user',
            content: 'Perfect! I can see the Pro plan and credits now. Will this happen again next month?',
            createdAt: new Date('2024-01-18T09:25:00Z').toISOString(),
        },
        {
            chatId: 3,
            userId: 'pro-test-user-456',
            role: 'assistant',
            content: 'No, this was a one-time sync issue that we\'ve since resolved. Your future monthly renewals should process automatically without any delays. If you experience any issues, don\'t hesitate to reach out!',
            createdAt: new Date('2024-01-18T09:26:00Z').toISOString(),
        },

        // Chat ID 4 (userId '999'): "Feature request discussion" - feature requests
        {
            chatId: 4,
            userId: '999',
            role: 'user',
            content: 'I love the platform! Would it be possible to add support for scheduling emails to be sent at specific times?',
            createdAt: new Date('2024-01-20T11:00:00Z').toISOString(),
        },
        {
            chatId: 4,
            userId: '999',
            role: 'assistant',
            content: 'Thank you for the feedback! Email scheduling is actually one of our most requested features. We\'re planning to add this in our next major update. What specific scheduling options would be most valuable for your workflow?',
            createdAt: new Date('2024-01-20T11:02:00Z').toISOString(),
        },
        {
            chatId: 4,
            userId: '999',
            role: 'user',
            content: 'I\'d love to be able to schedule emails for different time zones and maybe set up recurring sends for weekly newsletters.',
            createdAt: new Date('2024-01-20T11:05:00Z').toISOString(),
        },
        {
            chatId: 4,
            userId: '999',
            role: 'assistant',
            content: 'Excellent suggestions! Time zone support and recurring sends are definitely on our roadmap. I\'ll add your specific use case to our feature request board. We expect to roll out basic scheduling in Q2 2024, with advanced features like recurring sends following shortly after.',
            createdAt: new Date('2024-01-20T11:07:00Z').toISOString(),
        },

        // Chat ID 5 (userId 'test-user-123'): "Integration help needed" - API/integration help
        {
            chatId: 5,
            userId: 'test-user-123',
            role: 'user',
            content: 'I\'m trying to integrate your API with my CRM system. Do you have any documentation or examples for bulk email sending?',
            createdAt: new Date('2024-01-22T16:00:00Z').toISOString(),
        },
        {
            chatId: 5,
            userId: 'test-user-123',
            role: 'assistant',
            content: 'Absolutely! Our API documentation is available at docs.ourplatform.com/api. For bulk sending, you\'ll want to use the /api/v1/emails/bulk endpoint. I can also share some sample code - what programming language are you using?',
            createdAt: new Date('2024-01-22T16:02:00Z').toISOString(),
        },
        {
            chatId: 5,
            userId: 'test-user-123',
            role: 'user',
            content: 'I\'m working with Node.js. Also, what\'s the rate limit for the bulk endpoint?',
            createdAt: new Date('2024-01-22T16:05:00Z').toISOString(),
        },
        {
            chatId: 5,
            userId: 'test-user-123',
            role: 'assistant',
            content: 'Perfect! For Node.js, you can use our official SDK: npm install @ourplatform/api-client. The bulk endpoint allows up to 100 emails per request, with a rate limit of 10 requests per minute for Pro users. I\'ll send you a complete integration example via email.',
            createdAt: new Date('2024-01-22T16:06:00Z').toISOString(),
        },
        {
            chatId: 5,
            userId: 'test-user-123',
            role: 'user',
            content: 'That\'s exactly what I needed. One more question - can I track delivery status through the API?',
            createdAt: new Date('2024-01-22T16:08:00Z').toISOString(),
        },
        {
            chatId: 5,
            userId: 'test-user-123',
            role: 'assistant',
            content: 'Yes! You can track delivery status using webhooks or by polling the /api/v1/emails/{id}/status endpoint. We support status updates for sent, delivered, bounced, and opened events. The webhook approach is more efficient for real-time tracking.',
            createdAt: new Date('2024-01-22T16:09:00Z').toISOString(),
        },
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});