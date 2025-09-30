import { db } from '@/db';
import { chats } from '@/db/schema';

async function main() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const sampleChats = [
        {
            userId: '999',
            title: 'Getting Started with AI Email Assistant',
            createdAt: threeDaysAgo,
            updatedAt: new Date(threeDaysAgo.getTime() + 2 * 60 * 60 * 1000),
        },
        {
            userId: '999',
            title: 'Technical Support - SMTP Configuration Issues',
            createdAt: twoDaysAgo,
            updatedAt: new Date(twoDaysAgo.getTime() + 45 * 60 * 1000),
        },
        {
            userId: '999',
            title: 'Billing Question - Upgrading to Pro Plan',
            createdAt: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000),
            updatedAt: new Date(twoDaysAgo.getTime() + 5 * 60 * 60 * 1000),
        },
        {
            userId: '999',
            title: 'Feature Request - Custom Email Templates',
            createdAt: oneDayAgo,
            updatedAt: new Date(oneDayAgo.getTime() + 3 * 60 * 60 * 1000),
        },
        {
            userId: '999',
            title: 'API Integration Help - Webhook Setup',
            createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
            updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
        }
    ];

    await db.insert(chats).values(sampleChats);
    
    console.log('✅ Chats seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});