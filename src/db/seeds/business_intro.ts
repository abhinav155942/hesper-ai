import { db } from '@/db';
import { businessIntro } from '@/db/schema';

async function main() {
    const sampleBusinessIntros = [
        {
            userId: '999',
            userName: 'Sarah Chen',
            businessDescription: 'AI-powered SaaS company specializing in customer relationship management solutions for small to medium businesses',
            businessIntro: 'Hi, I\'m Sarah Chen, CEO and founder of TechFlow Solutions. We help businesses streamline their customer relationships through our innovative AI-powered CRM platform. With over 8 years of experience in enterprise software development, I\'ve built TechFlow to solve the real pain points that growing companies face when managing their customer data and communications.',
            createdAt: new Date('2024-01-15').getTime(),
            updatedAt: new Date('2024-01-15').getTime(),
        },
        {
            userId: 'test-user-123',
            userName: 'Marcus Rodriguez',
            businessDescription: 'Digital marketing consultant helping e-commerce brands increase their online visibility and conversion rates through data-driven strategies',
            businessIntro: 'Hello! I\'m Marcus Rodriguez, a digital marketing strategist with a passion for helping e-commerce businesses grow their online presence. Over the past 6 years, I\'ve worked with over 150 brands to optimize their marketing funnels, improve their conversion rates, and scale their revenue. I specialize in paid advertising, SEO, and conversion rate optimization, combining creativity with analytical insights to deliver measurable results.',
            createdAt: new Date('2024-02-01').getTime(),
            updatedAt: new Date('2024-02-01').getTime(),
        }
    ];

    await db.insert(businessIntro).values(sampleBusinessIntros);
    
    console.log('✅ Business intro seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});