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

  // Mock response since no webhook is connected
  const mockResponse = { message: `Echo: ${message}. This is a mock AI response.` };

  return NextResponse.json(mockResponse);
}