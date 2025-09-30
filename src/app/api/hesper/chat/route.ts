import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettingsKeyValueLines } from "@/lib/settings-helpers";
import { getUserSettingsJson } from "@/lib/settings-helpers";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

// Simple in-memory coalescing + short cache to avoid duplicate upstream calls
// Keyed by message+model for a few seconds
const pending = new Map<string, Promise<{ text: string; status: number; contentType: string }>>();
const cache = new Map<string, { data: { text: string; status: number; contentType: string }; expires: number }>();
const CACHE_TTL_MS = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message ?? body?.prompt ?? body?.text ?? body?.query ?? "";
    const model = body?.model ?? "";
    const chatHistoryIn = Array.isArray(body?.chat_history) ? body.chat_history : [];

    if (!message) {
      return Response.json({ error: "No message provided" }, { status: 400 });
    }

    // Auth user (to fetch per-user settings context)
    const user = await getCurrentUser(req);
    const userId = user?.id ? String(user.id) : "anon";

    const key = `${message.trim()}|${String(model)}|${userId}`;

    // Serve from short cache if available
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && cached.expires > now) {
      return new Response(cached.data.text, {
        status: cached.data.status,
        headers: { "Content-Type": cached.data.contentType, "Cache-Control": "no-store" },
      });
    }

    // Coalesce concurrent identical requests
    if (pending.has(key)) {
      const result = await pending.get(key)!;
      return new Response(result.text, {
        status: result.status,
        headers: { "Content-Type": result.contentType, "Cache-Control": "no-store" },
      });
    }

    const exec = (async () => {
      // Build JSON context from all current settings
      let settings: any = {};
      try {
        if (user?.id) {
          settings = await getUserSettingsJson(String(user.id));
        }
      } catch {}

      // Ensure every expected settings key is present (null when not configured)
      const defaultSettings = {
        business_intro: null,
        pros: null as string[] | null,
        differences: null as string[] | null,
        email_format: null,
        smtp: {
          host: null as string | null,
          port: null as number | null,
          username: null as string | null,
          password: null as string | null,
          client_hostname: null as string | null,
          ssl_tls_enabled: null as boolean | null,
        },
        email_tone: null,
        email_description: null,
        email_signature: null,
        subject_templates: null as string[] | null,
        user_name: null,
        business_description: null,
      };

      const fullSettings = {
        ...defaultSettings,
        ...(settings || {}),
        smtp: { ...defaultSettings.smtp, ...(settings?.smtp || {}) },
      };

      // Normalize chat history to last 6 messages (user + assistant roles)
      const chat_history = chatHistoryIn
        .filter((m: any) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
        .slice(-6);

      const payload = {
        user_id: userId,
        model: model || null,
        user_message: message,
        chat_history,
        settings: fullSettings,
      };

      // Send as JSON to n8n
      const upstream = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        // Prevent intermediary caches and proxies from retrying
        cache: "no-store",
      });

      const contentType = upstream.headers.get("content-type") || "text/plain";
      const status = upstream.status;
      const text = await upstream.text();

      const data = { text, status, contentType };
      // Set short cache window to absorb immediate duplicates
      cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
      return data;
    })();

    pending.set(key, exec);

    try {
      const result = await exec;
      return new Response(result.text, {
        status: result.status,
        headers: { "Content-Type": result.contentType, "Cache-Control": "no-store" },
      });
    } finally {
      pending.delete(key);
    }
  } catch (err: any) {
    return new Response(
      `Error: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}