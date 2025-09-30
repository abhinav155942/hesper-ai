import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const sampleMessages = [
        // Chat ID 1: Getting started questions
        {
            chatId: 1,
            userId: '999',
            role: 'user' as const,
            content: 'Hi there! I just signed up for the platform and I\'m trying to understand how everything works. Could you walk me through the basic features and how to get started with my first project?',
            createdAt: new Date('2024-01-15T09:00:00Z').getTime(),
        },
        {
            chatId: 1,
            userId: '999',
            role: 'assistant' as const,
            content: 'Welcome to the platform! I\'d be happy to help you get started. The main features include project management, team collaboration, and automated workflows. To create your first project, click the "New Project" button in your dashboard, choose a template that fits your needs, and follow the setup wizard. You can then invite team members and configure your workflow settings. Would you like me to explain any specific feature in more detail?',
            createdAt: new Date('2024-01-15T09:02:00Z').getTime(),
        },
        {
            chatId: 1,
            userId: '999',
            role: 'user' as const,
            content: 'That sounds great! I\'m particularly interested in the automated workflows. How do I set those up and what kind of automation is available?',
            createdAt: new Date('2024-01-15T09:05:00Z').getTime(),
        },
        {
            chatId: 1,
            userId: '999',
            role: 'assistant' as const,
            content: 'Automated workflows are one of our most powerful features! You can access them from the "Automation" tab in your project settings. We offer several types: task automation (automatically assign tasks based on criteria), notification triggers (send alerts when conditions are met), and integration workflows (connect with external tools like Slack, GitHub, or email). To get started, I recommend using our pre-built templates - they\'re perfect for common scenarios like onboarding new team members or managing project milestones.',
            createdAt: new Date('2024-01-15T09:07:30Z').getTime(),
        },

        // Chat ID 2: Technical support - upload issues
        {
            chatId: 2,
            userId: '999',
            role: 'user' as const,
            content: 'I\'m having trouble uploading files to my project. Every time I try to upload a document larger than 10MB, it fails with an error message saying "Upload timeout". This is really frustrating because I need to share these files with my team today.',
            createdAt: new Date('2024-01-16T14:30:00Z').getTime(),
        },
        {
            chatId: 2,
            userId: '999',
            role: 'assistant' as const,
            content: 'I understand how frustrating upload issues can be, especially when you\'re on a deadline. The timeout error for files larger than 10MB is usually caused by connection instability or browser limitations. Let\'s try a few solutions: First, try using a different browser (Chrome or Firefox work best). Second, check if you can break the file into smaller chunks. If that doesn\'t work, try our desktop app which handles large files better than the web interface. Can you tell me what type of file you\'re trying to upload and what browser you\'re currently using?',
            createdAt: new Date('2024-01-16T14:32:00Z').getTime(),
        },
        {
            chatId: 2,
            userId: '999',
            role: 'user' as const,
            content: 'I\'m using Safari on Mac and trying to upload a 15MB PDF document. I\'ll try switching to Chrome as you suggested.',
            createdAt: new Date('2024-01-16T14:35:00Z').getTime(),
        },
        {
            chatId: 2,
            userId: '999',
            role: 'assistant' as const,
            content: 'Perfect! Safari can have issues with large file uploads due to its strict timeout settings. Chrome should handle your 15MB PDF much better. If you still encounter issues with Chrome, you can also try our direct upload feature - just drag and drop the file directly onto the project files area instead of using the upload button. This bypasses some browser limitations. Let me know if the Chrome switch resolves the issue, and I\'ll be here to help with any other upload problems.',
            createdAt: new Date('2024-01-16T14:37:00Z').getTime(),
        },

        // Chat ID 3: Billing questions
        {
            chatId: 3,
            userId: '999',
            role: 'user' as const,
            content: 'I noticed an unexpected charge on my account for $49.99 last week. I\'m currently on the basic plan which should be $19.99 per month. Could you help me understand what this additional charge is for?',
            createdAt: new Date('2024-01-17T11:15:00Z').getTime(),
        },
        {
            chatId: 3,
            userId: '999',
            role: 'assistant' as const,
            content: 'I\'d be happy to help you understand that charge. The additional $49.99 charge appears to be for premium features that were used during your billing cycle. This typically happens when you exceed your plan limits - for example, using advanced analytics, additional storage, or premium integrations. Let me check your usage details. It looks like you used 15GB of extra storage and accessed our premium reporting features. These overages are billed separately. Would you like me to explain how to monitor your usage to avoid surprise charges in the future?',
            createdAt: new Date('2024-01-17T11:17:30Z').getTime(),
        },
        {
            chatId: 3,
            userId: '999',
            role: 'user' as const,
            content: 'That makes sense now. Yes, I would definitely like to know how to monitor my usage and maybe consider upgrading to a plan that includes more storage.',
            createdAt: new Date('2024-01-17T11:20:00Z').getTime(),
        },

        // Chat ID 4: Feature requests
        {
            chatId: 4,
            userId: '999',
            role: 'user' as const,
            content: 'I love using the platform, but I have a suggestion that would make it even better. Would it be possible to add a calendar integration feature? It would be amazing if tasks and deadlines could sync with Google Calendar or Outlook.',
            createdAt: new Date('2024-01-18T16:45:00Z').getTime(),
        },
        {
            chatId: 4,
            userId: '999',
            role: 'assistant' as const,
            content: 'That\'s an excellent suggestion! Calendar integration is actually one of our most requested features, and I\'m excited to tell you it\'s already in development. We\'re planning to release Google Calendar and Outlook integration in our Q2 update, which should be available in the next 2-3 months. The integration will allow you to sync project deadlines, task due dates, and team meetings directly to your preferred calendar. You\'ll also be able to create tasks from calendar events. We\'ll be looking for beta testers soon - would you be interested in trying it out early?',
            createdAt: new Date('2024-01-18T16:47:00Z').getTime(),
        },
        {
            chatId: 4,
            userId: '999',
            role: 'user' as const,
            content: 'Absolutely! I\'d love to be a beta tester. That timeline sounds perfect, and having two-way sync would be incredibly useful for my workflow.',
            createdAt: new Date('2024-01-18T16:50:00Z').getTime(),
        },
        {
            chatId: 4,
            userId: '999',
            role: 'assistant' as const,
            content: 'Wonderful! I\'ve added you to our beta tester list for the calendar integration feature. You\'ll receive an email invitation when the beta program opens, likely in the next 4-6 weeks. The beta will include both Google Calendar and Outlook support, with full two-way synchronization as you mentioned. We really value feedback from active users like yourself, as it helps us build features that truly meet your needs. Is there anything else on your wishlist for future updates?',
            createdAt: new Date('2024-01-18T16:52:30Z').getTime(),
        },

        // Chat ID 5: API integration - authentication issues
        {
            chatId: 5,
            userId: '999',
            role: 'user' as const,
            content: 'I\'m trying to integrate our internal system with your API, but I keep getting authentication errors. I\'ve generated an API key from my account settings, but every request returns a 401 Unauthorized error. What am I doing wrong?',
            createdAt: new Date('2024-01-19T10:20:00Z').getTime(),
        },
        {
            chatId: 5,
            userId: '999',
            role: 'assistant' as const,
            content: 'API authentication issues are usually related to how the API key is being sent in the request. Make sure you\'re including the API key in the Authorization header using this format: "Authorization: Bearer YOUR_API_KEY". Also, verify that you\'re using the correct base URL (https://api.ourplatform.com/v1/) and that your API key hasn\'t expired. API keys are valid for 90 days by default. Can you share the code snippet you\'re using for the authentication? I can help you troubleshoot the specific implementation.',
            createdAt: new Date('2024-01-19T10:22:30Z').getTime(),
        },
        {
            chatId: 5,
            userId: '999',
            role: 'user' as const,
            content: 'I think I found the issue - I was sending the API key in the wrong header format. Let me try your suggestion with the Bearer token format and see if that resolves it.',
            createdAt: new Date('2024-01-19T10:25:00Z').getTime(),
        },
        {
            chatId: 5,
            userId: '999',
            role: 'assistant' as const,
            content: 'That\'s likely the issue! The Bearer token format is required for our API authentication. Once you update your header to use "Authorization: Bearer YOUR_API_KEY", your requests should work properly. If you continue to have issues, also double-check that there are no extra spaces or characters in your API key. Our API documentation has additional examples and troubleshooting tips at docs.ourplatform.com/api. Feel free to reach out if you need help with any specific endpoints or have questions about rate limits.',
            createdAt: new Date('2024-01-19T10:27:00Z').getTime(),
        }
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});