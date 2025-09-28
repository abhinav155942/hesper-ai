import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            id: 'pro-test-user-456',
            name: 'Pro Test User',
            email: 'prouser@example.com',
            emailVerified: true,
            image: null,
            credits: 999999,
            subscriptionPlan: 'pro',
            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ Pro test user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});