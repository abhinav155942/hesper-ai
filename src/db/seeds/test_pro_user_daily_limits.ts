import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const today = new Date().toISOString().split('T')[0];
    const currentTimestamp = new Date();

    const testProUser = [
        {
            id: 'test-pro-user-daily-limits',
            name: 'Pro Test User - Daily Limits',
            email: 'pro.daily.limits@example.com',
            emailVerified: true,
            subscriptionPlan: 'pro',
            credits: 20,
            basicDailyLimit: 100,
            proDailyLimit: 50,
            dailyBasicMessages: 0,
            dailyProMessages: 0,
            basicMessageCount: 0,
            proMessageCount: 0,
            subscriptionExpiry: thirtyDaysFromNow,
            lastResetDate: today,
            dailyMessages: 0,
            image: null,
            sendgridApiKey: null,
            sendgridDomain: null,
            mailgunApiKey: null,
            mailgunDomain: null,
            emailProvider: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(user).values(testProUser);
    
    console.log('✅ Test pro user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});