import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

export async function POST(request: NextRequest) {
  const h = headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const token = h.get("authorization")?.replace("Bearer ", "");

  // Parse JSON body
  let message: string;
  let model: string;
  let history: any[] = [];
  try {
    const body = await request.json();
    message = body.message;
    model = body.model || 'default';
    history = body.history || [];
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
  }

  // Check credits before processing
  const creditsRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/credits`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!creditsRes.ok) {
    return NextResponse.json({ error: "Failed to check credits" }, { status: 500 });
  }
  const { credits } = await creditsRes.json();

  if (credits < 1) {
    return NextResponse.json({ error: "Insufficient credits. Please purchase more." }, { status: 402 });
  }

  try {
    // Forward as JSON to n8n
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model, history })
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
        Authorization: `Bearer ${token}`
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