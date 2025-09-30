import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import * as paypal from '@paypal/checkout-server-sdk';

// Configure PayPal environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_SECRET!;
  
  return process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    const { orderID } = requestBody;

    // Validate orderID
    if (!orderID) {
      return NextResponse.json(
        { error: 'OrderID is required', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      );
    }

    // Create PayPal capture request
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
    captureRequest.requestBody({});

    // Capture the PayPal order
    let captureResponse;
    try {
      captureResponse = await client().execute(captureRequest);
    } catch (paypalError) {
      console.error('PayPal capture error:', paypalError);
      return NextResponse.json(
        { error: 'PayPal payment capture failed', code: 'PAYPAL_CAPTURE_FAILED' },
        { status: 400 }
      );
    }

    // Check if capture was successful
    if (captureResponse.result.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment was not completed', code: 'PAYMENT_NOT_COMPLETED' },
        { status: 400 }
      );
    }

    // Get current user data to calculate new credits
    const currentUserData = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (currentUserData.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const userData = currentUserData[0];
    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + 100;

    // Calculate subscription expiry (30 days from now)
    const subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update user subscription and credits
    const updatedUser = await db.update(user)
      .set({
        subscriptionPlan: 'basic',
        subscriptionExpiry: subscriptionExpiry,
        credits: newCredits,
        basicMessageCount: 0, // Reset message counters
        proMessageCount: 0,   // Reset message counters
        updatedAt: new Date()
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user subscription', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Return success response with new subscription details
    return NextResponse.json({
      success: true,
      message: 'Payment captured and subscription updated successfully',
      subscription: {
        plan: 'basic',
        expiry: subscriptionExpiry.toISOString(),
        credits: newCredits
      },
      paypalOrderId: orderID,
      paypalStatus: captureResponse.result.status
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}