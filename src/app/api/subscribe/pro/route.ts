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

    // Validate PayPal environment variables
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials missing');
      return NextResponse.json({ 
        error: 'PayPal configuration error',
        code: 'PAYPAL_CONFIG_ERROR' 
      }, { status: 500 });
    }

    // Set up PayPal Live environment
    const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);

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

    // Execute PayPal order creation
    const order = await client.execute(request_order);

    if (!order.result || !order.result.id) {
      console.error('PayPal order creation failed:', order);
      return NextResponse.json({ 
        error: 'Failed to create PayPal order',
        code: 'PAYPAL_ORDER_CREATION_FAILED' 
      }, { status: 500 });
    }

    // Return success response with order ID
    return NextResponse.json({ 
      orderID: order.result.id 
    }, { status: 201 });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    
    // Handle PayPal specific errors
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'PayPal service error: ' + error.message,
        code: 'PAYPAL_SERVICE_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Internal server error while creating PayPal order',
      code: 'INTERNAL_SERVER_ERROR' 
    }, { status: 500 });
  }
}