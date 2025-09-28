import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

interface ResponseData {
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  if (request.method !== "POST") return NextResponse.json({ error: "Method not allowed" }, { status: 405 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([message]),
    });

    if (!webhookResponse.ok) {
      const err = await webhookResponse.text();
      return NextResponse.json({ error: err || "n8n workflow error" }, { status: 500 });
    }

    const data = await webhookResponse.json();

    if (Array.isArray(data)) {
      return NextResponse.json(data);
    } else if (data && typeof data === "object" && "message" in data) {
      return NextResponse.json({ message: data.message });
    } else {
      return NextResponse.json({ message: "No response received" });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}