import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + 30);

    const sampleUsers = [
        {
            id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'John Doe',
            email: 'john.doe@company.com',
            emailVerified: true,
            image: null,
            credits: 10,
            subscriptionPlan: 'free',
            subscriptionExpiry: null,
            dailyMessages: 0,
            lastResetDate: null,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
        },
        {
            id: 'user_02h5lyu3f9a0z4c2o8n7r6x9s5',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@business.com',
            emailVerified: true,
            image: null,
            credits: 150,
            subscriptionPlan: 'basic',
            subscriptionExpiry: subscriptionExpiry,
            dailyMessages: 0,
            lastResetDate: null,
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-02-01'),
        },
        {
            id: 'user_03h6mzv4g0b1a5d3p9o8s7y0t6',
            name: 'Michael Chen',
            email: 'michael.chen@startup.io',
            emailVerified: true,
            image: null,
            credits: 200,
            subscriptionPlan: 'pro',
            subscriptionExpiry: subscriptionExpiry,
            dailyMessages: 25,
            lastResetDate: today.toISOString().split('T')[0],
            createdAt: new Date('2024-02-05'),
            updatedAt: new Date('2024-02-05'),
        },
        {
            id: 'user_04h7n0w5h1c2b6e4q0p9t8z1u7',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@agency.com',
            emailVerified: true,
            image: null,
            credits: 0,
            subscriptionPlan: 'pro',
            subscriptionExpiry: subscriptionExpiry,
            dailyMessages: 45,
            lastResetDate: today.toISOString().split('T')[0],
            createdAt: new Date('2024-02-10'),
            updatedAt: new Date('2024-02-10'),
        },
        {
            id: 'user_05h8o1x6i2d3c7f5r1q0u9a2v8',
            name: 'David Thompson',
            email: 'david.thompson@consulting.com',
            emailVerified: true,
            image: null,
            credits: 100,
            subscriptionPlan: 'pro',
            subscriptionExpiry: subscriptionExpiry,
            dailyMessages: 0,
            lastResetDate: yesterday.toISOString().split('T')[0],
            createdAt: new Date('2024-02-12'),
            updatedAt: new Date('2024-02-12'),
        },
        {
            id: 'user_06h9p2y7j3e4d8g6s2r1v0b3w9',
            name: 'Lisa Anderson',
            email: 'lisa.anderson@marketing.com',
            emailVerified: false,
            image: null,
            credits: 5,
            subscriptionPlan: 'free',
            subscriptionExpiry: null,
            dailyMessages: 3,
            lastResetDate: today.toISOString().split('T')[0],
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date('2024-02-15'),
        },
        {
            id: 'user_07h0q3z8k4f5e9h7t3s2w1c4x0',
            name: 'Robert Kim',
            email: 'robert.kim@tech.com',
            emailVerified: true,
            image: null,
            credits: 75,
            subscriptionPlan: 'basic',
            subscriptionExpiry: subscriptionExpiry,
            dailyMessages: 12,
            lastResetDate: today.toISOString().split('T')[0],
            createdAt: new Date('2024-02-18'),
            updatedAt: new Date('2024-02-18'),
        }
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ User seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});