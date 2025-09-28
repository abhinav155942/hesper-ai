import { NextRequest } from "next/server";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message ?? body?.prompt ?? body?.text ?? body?.query ?? "";

    if (!message) {
      return Response.json({ error: "No message provided" }, { status: 400 });
    }

    // Send only the raw message as plain text to n8n
    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: message, // Raw text, no JSON
    });

    const contentType = upstream.headers.get("content-type") || "text/plain";
    const status = upstream.status;

    const text = await upstream.text();
    
    let responseText = text;
    if (contentType?.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        responseText = json.output || text;
      } catch (e) {
        // If JSON parsing fails, keep original text
      }
    }

    return new Response(responseText, {
      status,
      headers: { "Content-Type": "text/plain" },  // Always return as plain text
    });
  } catch (err: any) {
    return Response(
      `Error: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}