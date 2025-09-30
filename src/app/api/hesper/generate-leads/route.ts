import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required. Please login to continue.',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Parse and validate request body
    const requestBody = await request.json();
    const { query, numLeads } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'Query is required and must be a string',
        code: 'INVALID_QUERY' 
      }, { status: 400 });
    }

    if (!numLeads || typeof numLeads !== 'number' || numLeads <= 0 || !Number.isInteger(numLeads)) {
      return NextResponse.json({ 
        error: 'Number of leads is required and must be a positive integer',
        code: 'INVALID_NUM_LEADS' 
      }, { status: 400 });
    }

    // Get current user's subscription and credits
    const userRecord = await db.select({ 
      credits: user.credits,
      subscriptionPlan: user.subscriptionPlan
    })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const userData = userRecord[0];
    const subscriptionPlan = userData.subscriptionPlan || 'free';

    // Restrict access to Pro users only
    if (subscriptionPlan !== 'pro') {
      return NextResponse.json({ 
        error: 'Lead generation is only available in Pro plan.',
        code: 'PRO_PLAN_REQUIRED' 
      }, { status: 403 });
    }

    // Calculate credits cost
    const creditsRequired = Math.ceil(numLeads / 10) * 5;
    const currentCredits = userData.credits;

    // Check if user has sufficient credits
    if (currentCredits < creditsRequired) {
      return NextResponse.json({ 
        error: `Insufficient credits. You need ${creditsRequired} credits but only have ${currentCredits}. Please upgrade your plan.`,
        code: 'INSUFFICIENT_CREDITS' 
      }, { status: 402 });
    }

    // Deduct credits from user's account
    const updatedUser = await db.update(user)
      .set({
        credits: currentCredits - creditsRequired,
        updatedAt: new Date()
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update user credits',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Generate mock leads with realistic fake data
    const generateMockLeads = (count: number) => {
      const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 'William', 'Jennifer', 'Richard', 'Patricia', 'Thomas', 'Linda', 'Christopher', 'Barbara', 'Daniel', 'Elizabeth'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
      const companies = ['TechCorp Inc', 'Global Solutions LLC', 'Innovation Partners', 'Digital Dynamics', 'Future Systems', 'Smart Enterprises', 'NextGen Technologies', 'Premier Solutions', 'Advanced Analytics', 'Strategic Consulting', 'Modern Industries', 'Elite Services', 'Precision Technologies', 'Growth Partners', 'Excellence Group'];
      const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com', 'business.org', 'enterprise.net'];

      const leads = [];
      for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const company = companies[Math.floor(Math.random() * companies.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;

        leads.push({
          name: `${firstName} ${lastName}`,
          email: email,
          company: company
        });
      }
      return leads;
    };

    const mockLeads = generateMockLeads(numLeads);
    const remainingCredits = updatedUser[0].credits;

    return NextResponse.json({
      leads: mockLeads,
      creditsUsed: creditsRequired,
      remainingCredits: remainingCredits
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}