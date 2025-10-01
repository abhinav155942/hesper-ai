import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const today = new Date();
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setDate(today.getDate() + 30);

    const testBasicUser = {
        id: 'test-basic-user-daily-limits',
        name: 'Basic Test User - Daily Limits',
        email: 'basic.daily.limits@example.com',
        emailVerified: true,
        image: null,
        credits: 15,
        subscriptionPlan: 'basic',
        subscriptionExpiry: subscriptionExpiry,
        dailyMessages: 0,
        lastResetDate: today.toISOString().split('T')[0],
        basicMessageCount: 0,
        proMessageCount: 0,
        dailyBasicMessages: 0,
        dailyProMessages: 0,
        basicDailyLimit: 30,
        proDailyLimit: 3,
        sendgridApiKey: null,
        sendgridDomain: null,
        mailgunApiKey: null,
        mailgunDomain: null,
        emailProvider: null,
        createdAt: today,
        updatedAt: today,
    };

    await db.insert(user).values([testBasicUser]);
    
    console.log('✅ Test basic user for daily limits seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});