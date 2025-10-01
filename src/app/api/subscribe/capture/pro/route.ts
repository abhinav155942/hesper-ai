import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import * as paypal from '@paypal/checkout-server-sdk';

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_SECRET!;
  
  return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Parse request body
    const requestBody = await request.json();
    const { orderID } = requestBody;

    // Validate orderID
    if (!orderID) {
      return NextResponse.json({ 
        error: 'Order ID is required',
        code: 'MISSING_ORDER_ID' 
      }, { status: 400 });
    }

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Create PayPal capture request
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
    captureRequest.requestBody({});

    // Capture PayPal order
    let captureResponse;
    try {
      captureResponse = await client().execute(captureRequest);
    } catch (paypalError) {
      console.error('PayPal capture error:', paypalError);
      return NextResponse.json({ 
        error: 'PayPal payment capture failed',
        code: 'PAYPAL_CAPTURE_FAILED' 
      }, { status: 400 });
    }

    // Check if payment was completed
    if (captureResponse.result.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Payment was not completed successfully',
        code: 'PAYMENT_NOT_COMPLETED' 
      }, { status: 400 });
    }

    // Calculate subscription expiry (30 days from now)
    const subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update user subscription with pro daily limits
    const updatedUser = await db.update(user)
      .set({
        subscriptionPlan: 'pro',
        subscriptionExpiry: subscriptionExpiry,
        credits: 999999,
        basicMessageCount: 0, // Reset message counters
        proMessageCount: 0,   // Reset message counters
        dailyBasicMessages: 0, // Reset daily counters
        dailyProMessages: 0,   // Reset daily counters
        basicDailyLimit: 100,  // Pro users get higher basic limit
        proDailyLimit: 50,     // Pro users get higher pro limit
        updatedAt: new Date()
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({
      message: 'Subscription upgraded successfully',
      subscription: {
        plan: 'pro',
        expiry: subscriptionExpiry.toISOString(),
        credits: 999999,
        basicDailyLimit: 100,
        proDailyLimit: 50
      },
      paypalOrderId: orderID,
      paymentStatus: captureResponse.result.status
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}