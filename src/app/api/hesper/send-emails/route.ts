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
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    const { leads, template } = requestBody;

    // Validate required fields
    if (!leads) {
      return NextResponse.json({ 
        error: 'Leads array is required',
        code: 'MISSING_LEADS'
      }, { status: 400 });
    }

    if (!template) {
      return NextResponse.json({ 
        error: 'Template is required',
        code: 'MISSING_TEMPLATE'
      }, { status: 400 });
    }

    // Validate leads is an array
    if (!Array.isArray(leads)) {
      return NextResponse.json({ 
        error: 'Leads must be an array',
        code: 'INVALID_LEADS_FORMAT'
      }, { status: 400 });
    }

    // Validate template is a string
    if (typeof template !== 'string' || template.trim() === '') {
      return NextResponse.json({ 
        error: 'Template must be a non-empty string',
        code: 'INVALID_TEMPLATE_FORMAT'
      }, { status: 400 });
    }

    // Calculate credits cost
    const creditsRequired = Math.ceil(leads.length / 10) * 5;

    // Get current user's credits
    const userRecord = await db.select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const currentCredits = userRecord[0].credits;

    // Check if user has sufficient credits
    if (currentCredits < creditsRequired) {
      return NextResponse.json({ 
        error: `Insufficient credits. You need ${creditsRequired} credits but only have ${currentCredits}.`,
        code: 'INSUFFICIENT_CREDITS'
      }, { status: 400 });
    }

    // Deduct credits from user's account
    const newCreditsBalance = currentCredits - creditsRequired;
    
    const updatedUser = await db.update(user)
      .set({
        credits: newCreditsBalance,
        updatedAt: new Date()
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update user credits',
        code: 'CREDITS_UPDATE_FAILED'
      }, { status: 500 });
    }

    // Simulate email sending (no actual sending)
    // In a real implementation, this would integrate with an email service
    const emailsSent = leads.length;

    // Return success response
    return NextResponse.json({
      success: true,
      emailsSent: emailsSent,
      creditsUsed: creditsRequired,
      remainingCredits: newCreditsBalance
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/send-emails error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}