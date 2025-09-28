import * as paypal from '@paypal/checkout-server-sdk';

const environment = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID as string,
  process.env.PAYPAL_SECRET as string
);
const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const rawAmount = (body as any)?.amount;
    const currency = (body as any)?.currency || 'USD';

    const parsed = Number.parseFloat(
      typeof rawAmount === 'string' ? rawAmount : String(rawAmount ?? '0')
    );
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const requestBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: parsed.toFixed(2),
          },
        },
      ],
    } as const;

    const createOrderRequest = new paypal.orders.OrdersCreateRequest();
    createOrderRequest.requestBody(requestBody);
    const response = await client.execute(createOrderRequest);

    return Response.json({ orderID: response.result.id });
  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    return Response.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}