import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Parse JSON body
  let message: string;
  let model: string;
  try {
    const body = await request.json();
    message = body.message;
    model = body.model || 'default';
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  // Check credits before processing
  const creditsRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/credits`, {
    headers: { Authorization: `Bearer ${await session.token}` }
  });
  if (!creditsRes.ok) {
    return NextResponse.json({ error: "Failed to check credits" }, { status: 500 });
  }
  const { credits } = await creditsRes.json();

  if (credits < 1) {
    return NextResponse.json({ error: "Insufficient credits. Please purchase more." }, { status: 402 });
  }

  try {
    // Forward as text/plain to n8n
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: message
    });

    if (!n8nRes.ok) {
      const errorText = await n8nRes.text();
      console.error("n8n error:", errorText);
      throw new Error(`n8n request failed: ${n8nRes.status} ${errorText}`);
    }

    const n8nData = await n8nRes.text();

    // Deduct credit after successful response
    const deductRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/credits/deduct`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${await session.token}`
      },
      body: JSON.stringify({ amount: 1 })
    });

    if (!deductRes.ok) {
      console.error("Failed to deduct credits:", await deductRes.text());
      // Don't fail the response if deduct fails, but log it
    }

    return NextResponse.json({ response: n8nData });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}