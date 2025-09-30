import { db } from '@/db';
import { chats } from '@/db/schema';

async function main() {
    const sampleChats = [
        {
            userId: '999',
            title: 'Getting started with our platform',
            createdAt: new Date('2024-12-18T10:30:00Z'),
            updatedAt: new Date('2024-12-18T10:30:00Z'),
        },
        {
            userId: 'test-user-123',
            title: 'Technical support inquiry',
            createdAt: new Date('2024-12-17T14:15:00Z'),
            updatedAt: new Date('2024-12-19T09:45:00Z'),
        },
        {
            userId: 'pro-test-user-456',
            title: 'Billing and subscription questions',
            createdAt: new Date('2024-12-16T16:20:00Z'),
            updatedAt: new Date('2024-12-18T11:30:00Z'),
        },
        {
            userId: '999',
            title: 'Feature request discussion',
            createdAt: new Date('2024-12-19T08:45:00Z'),
            updatedAt: new Date('2024-12-19T08:45:00Z'),
        },
        {
            userId: 'test-user-123',
            title: 'Integration help needed',
            createdAt: new Date('2024-12-15T13:10:00Z'),
            updatedAt: new Date('2024-12-19T15:20:00Z'),
        }
    ];

    await db.insert(chats).values(sampleChats);
    
    console.log('✅ Chats seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});