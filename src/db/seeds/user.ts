import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const testUser = [
        {
            id: 'test-user-123',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: false,
            image: null,
            credits: 20,
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