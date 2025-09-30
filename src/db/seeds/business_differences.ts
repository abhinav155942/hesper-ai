import { db } from '@/db';
import { businessDifferences } from '@/db/schema';

async function main() {
    const sampleBusinessDifferences = [
        {
            userId: '999',
            value: 'Only provider with real-time AI personalization that adapts to customer behavior within seconds',
            createdAt: new Date('2024-01-15T10:30:00Z'),
            updatedAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
            userId: 'test-user-123',
            value: 'White-glove implementation with dedicated success manager vs competitors\' self-service approach',
            createdAt: new Date('2024-01-20T14:15:00Z'),
            updatedAt: new Date('2024-01-20T14:15:00Z'),
        },
        {
            userId: '999',
            value: '24/7 dedicated support team with guaranteed 2-minute response time for critical issues',
            createdAt: new Date('2024-01-25T09:45:00Z'),
            updatedAt: new Date('2024-01-25T09:45:00Z'),
        },
        {
            userId: 'test-user-123',
            value: 'Patented technology with 3x faster data processing speed and 99.99% uptime guarantee',
            createdAt: new Date('2024-02-01T16:20:00Z'),
            updatedAt: new Date('2024-02-01T16:20:00Z'),
        }
    ];

    await db.insert(businessDifferences).values(sampleBusinessDifferences);
    
    console.log('✅ Business differences seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});