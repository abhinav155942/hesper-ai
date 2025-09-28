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
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    // Environment variables validation
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    if (!clientId || !clientSecret) {
      console.error('PayPal environment variables not configured');
      return NextResponse.json({ 
        error: 'PayPal configuration error',
        code: 'PAYPAL_CONFIG_ERROR' 
      }, { status: 500 });
    }

    // Set up PayPal Live environment
    const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);

    // Create PayPal order request
    const request_body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '14.99'
          },
          description: 'Basic Monthly Subscription'
        }
      ]
    };

    const orderRequest = new paypal.orders.OrdersCreateRequest();
    orderRequest.prefer('return=representation');
    orderRequest.requestBody(request_body);

    // Execute PayPal order creation
    const order = await client.execute(orderRequest);

    if (!order.result || !order.result.id) {
      console.error('PayPal order creation failed - no order ID returned');
      return NextResponse.json({ 
        error: 'Failed to create PayPal order',
        code: 'PAYPAL_ORDER_FAILED' 
      }, { status: 500 });
    }

    // Return success response with order ID
    return NextResponse.json({
      orderID: order.result.id,
      status: order.result.status
    }, { status: 201 });

  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    
    // Handle PayPal specific errors
    if (error.name === 'HttpError' || error.statusCode) {
      return NextResponse.json({ 
        error: 'PayPal API error: ' + (error.message || 'Unknown PayPal error'),
        code: 'PAYPAL_API_ERROR',
        details: error.details || null
      }, { status: 500 });
    }

    // Handle general errors
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || error),
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}