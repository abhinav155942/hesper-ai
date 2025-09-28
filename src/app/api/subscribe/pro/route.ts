import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as paypal from '@paypal/checkout-server-sdk';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Create PayPal order request
    const request_order = new paypal.orders.OrdersCreateRequest();
    request_order.prefer("return=representation");
    request_order.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '29.99'
        },
        description: 'Pro Monthly Subscription'
      }]
    });

    // Set up PayPal environment based on NODE_ENV
    const environment =
      process.env.NODE_ENV === 'production'
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID as string,
            process.env.PAYPAL_SECRET as string
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID as string,
            process.env.PAYPAL_SECRET as string
          );
    const client = new paypal.core.PayPalHttpClient(environment);

    // Execute PayPal order creation
    const order = await client.execute(request_order);

    if (!order.result || !order.result.id) {
      return NextResponse.json({ 
        error: 'Failed to create PayPal order',
        code: 'PAYPAL_ORDER_CREATION_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({ orderID: order.result.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'PayPal service error: ' + (error as Error).message,
      code: 'PAYPAL_SERVICE_ERROR'
    }, { status: 500 });
  }
}