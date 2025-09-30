import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const now = new Date();
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setDate(now.getDate() + 30);
    
    const today = now.toISOString().split('T')[0];
    
    const sampleUser = [
        {
            id: 'pro-test-user-10-credits',
            name: 'Pro Test User',
            email: 'pro.test.10credits@example.com',
            emailVerified: true,
            image: null,
            credits: 10,
            subscriptionPlan: 'pro',
            subscriptionExpiry: subscriptionExpiry,
            dailyMessages: 0,
            lastResetDate: today,
            basicMessageCount: 0,
            proMessageCount: 0,
            createdAt: now,
            updatedAt: now,
        }
    ];

    await db.insert(user).values(sampleUser);
    
    console.log('✅ Pro test user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});