import * as paypal from '@paypal/checkout-server-sdk';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Switch to LIVE environment for capture
const environment = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID as string, 
  process.env.PAYPAL_SECRET as string
);
const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: Request) {
  try {
    // Check authentication first
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return Response.json({ 
        error: 'Authentication required. Please login to complete payment.' 
      }, { status: 401 });
    }

    const { orderID } = await request.json();

    if (!orderID) {
      return Response.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
    const captureResponse = await client.execute(captureRequest);

    if (captureResponse.result.status === 'COMPLETED') {
      // Add 150 credits to the authenticated user
      const userRecord = await db.select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, currentUser.id))
        .limit(1);

      if (userRecord.length === 0) {
        return Response.json({ 
          error: 'User not found', 
          paymentStatus: 'completed' 
        }, { status: 404 });
      }

      const currentCredits = userRecord[0].credits || 0;
      const newCreditsTotal = currentCredits + 150;

      // Update user's credits
      const updatedUser = await db.update(user)
        .set({
          credits: newCreditsTotal,
          updatedAt: new Date()
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      return Response.json({ 
        success: true, 
        details: captureResponse.result,
        creditsAdded: 150,
        newCreditsTotal: newCreditsTotal
      });
    } else {
      return Response.json({ error: 'Order capture failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('PayPal order capture error:', error);
    return Response.json({ 
      error: 'Failed to capture order', 
      details: error.message 
    }, { status: 500 });
  }
}