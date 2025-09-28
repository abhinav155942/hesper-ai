import { NextRequest, NextResponse } from 'next/server';
import * as paypal from '@paypal/checkout-server-sdk';

// Switch environment based on NODE_ENV
const environment =
  process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID || '',
        process.env.PAYPAL_SECRET || ''
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID || '',
        process.env.PAYPAL_SECRET || ''
      );
const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawAmount = body?.amount;
    const currency = body?.currency || 'USD';
    const parsed = Number.parseFloat(typeof rawAmount === 'string' ? rawAmount : String(rawAmount ?? '0'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const req = new paypal.orders.OrdersCreateRequest();
    req.prefer("return=representation");
    req.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: parsed.toFixed(2)
        },
        description: 'Checkout'
      }]
    });

    const response = await client.execute(req);
    return NextResponse.json({ orderID: response.result.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}