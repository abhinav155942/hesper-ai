import { db } from '@/db';
import { businessPros } from '@/db/schema';

async function main() {
    const sampleBusinessPros = [
        {
            userId: '999',
            value: '15+ years enterprise sales experience',
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: 'test-user-123',
            value: 'Expert in AI/ML lead generation',
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
        {
            userId: '999',
            value: 'Proven ROI track record with 300% average increase',
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-02-01').toISOString(),
        },
        {
            userId: 'test-user-123',
            value: 'Industry-leading customer retention rates at 95%',
            createdAt: new Date('2024-02-05').toISOString(),
            updatedAt: new Date('2024-02-05').toISOString(),
        },
        {
            userId: '999',
            value: 'Award-winning customer service team with 24/7 support',
            createdAt: new Date('2024-02-10').toISOString(),
            updatedAt: new Date('2024-02-10').toISOString(),
        }
    ];

    await db.insert(businessPros).values(sampleBusinessPros);
    
    console.log('✅ Business pros seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});