import { NextRequest, NextResponse } from "next/server";
import * as paypal from "@paypal/checkout-server-sdk";

// Live capture route
const environment =
  process.env.NODE_ENV === "production"
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID || "",
        process.env.PAYPAL_SECRET || ""
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID || "",
        process.env.PAYPAL_SECRET || ""
      );
const client = new paypal.core.PayPalHttpClient(environment);

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const req = new paypal.orders.OrdersCaptureRequest(orderId);
    req.requestBody({});

    const response = await client.execute(req);
    return NextResponse.json({ status: response.result.status });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}