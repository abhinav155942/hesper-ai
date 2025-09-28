import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const message = await request.text();

  // Check credits before processing
  const creditsRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/credits`, {
    headers: { Authorization: `Bearer ${session.token}` }
  });
  const { credits } = await creditsRes.json();

  if (credits < 1) {
    return NextResponse.json({ error: "Insufficient credits. Please purchase more." }, { status: 402 });
  }

  try {
    // Forward to n8n
    const n8nRes = await fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/hesper-chat`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: message
    });

    if (!n8nRes.ok) {
      throw new Error("n8n request failed");
    }

    const n8nData = await n8nRes.text();

    // Parse JSON if present
    let responseText = n8nData;
    try {
      const parsed = JSON.parse(n8nData);
      if (parsed.output) {
        responseText = parsed.output;
      }
    } catch (e) {
      // Not JSON, use as is
    }

    // Deduct credit after successful response
    await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/credits/deduct`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({ amount: 1 })
    });

    return NextResponse.json({ response: responseText });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}