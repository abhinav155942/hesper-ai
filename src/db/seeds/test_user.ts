import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const testUser = [
        {
            id: '999',
            name: 'SMTP Test User',
            email: 'smtp.test@example.com',
            emailVerified: true,
            image: null,
            credits: 100,
            subscriptionPlan: 'free',
            subscriptionExpiry: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(user).values(testUser);
    
    console.log('✅ Test user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});