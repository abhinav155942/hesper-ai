import { NextRequest } from "next/server";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message ?? body?.prompt ?? body?.text ?? body?.query ?? "";
    const model = body?.model ?? body?.modelId ?? "";

    // Send multiple aliases to be compatible with different n8n node mappings
    const payload = {
      message,
      model,
      prompt: message,
      query: message,
      text: message,
      input: message,
      // Include original for completeness
      original: body,
    };

    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get("content-type") || "text/plain";
    const status = upstream.status;

    if (contentType.includes("application/json")) {
      const data = await upstream.json().catch(() => ({}));
      return Response.json(data, { status });
    }

    const text = await upstream.text();
    return new Response(text, {
      status,
      headers: { "Content-Type": contentType },
    });
  } catch (err: any) {
    return Response.json(
      { error: "CHAT_PROXY_ERROR", message: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}