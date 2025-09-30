import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSettingsJson } from "@/lib/settings-helpers";

const N8N_WEBHOOK_URL = "https://abhinavt333.app.n8n.cloud/webhook/f36d4e7e-9b5a-4834-adb7-cf088808c191/chat";

// Simple in-memory coalescing + short cache to avoid duplicate upstream calls
// Keyed by message+model for a few seconds
const pending = new Map<string, Promise<{ text: string; status: number; contentType: string }>>();
const cache = new Map<string, { data: { text: string; status: number; contentType: string }; expires: number }>();
const CACHE_TTL_MS = 5000;

// Ensure we always send a complete settings shape with nulls when missing
function coalesce<T>(v: T | "" | undefined | null): T | null {
  return v === undefined || v === null || v === "" ? null : (v as T);
}

function ensureSettingsShape(raw: any) {
  const smtp = raw?.smtp || null;
  return {
    // business
    user_name: coalesce<string>(raw?.user_name),
    business_description: coalesce<string>(raw?.business_description),
    business_intro: coalesce<string>(raw?.business_intro),
    pros: Array.isArray(raw?.pros) ? raw.pros : [],
    differences: Array.isArray(raw?.differences) ? raw.differences : [],

    // email format
    email_tone: coalesce<string>(raw?.email_tone),
    email_description: coalesce<string>(raw?.email_description),
    email_signature: coalesce<string>(raw?.email_signature),
    subject_templates: Array.isArray(raw?.subject_templates) ? raw.subject_templates : [],
    email_format: coalesce<string>(raw?.email_format),

    // smtp
    smtp: smtp
      ? {
          host: coalesce<string>(smtp.host),
          port: smtp.port ?? null,
          username: coalesce<string>(smtp.username),
          password: coalesce<string>(smtp.password),
        }
      : {
          host: null,
          port: null,
          username: null,
          password: null,
        },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message ?? body?.prompt ?? body?.text ?? body?.query ?? "";
    const model = body?.model ?? "";
    const historyIn = Array.isArray(body?.history) ? body.history : [];
    const chatId = body?.chatId ?? null;

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
          const raw = await getUserSettingsJson(String(user.id));
          settings = ensureSettingsShape(raw);
        } else {
          settings = ensureSettingsShape({});
        }
      } catch {
        settings = ensureSettingsShape({});
      }

      // Take up to last 6 messages (user/assistant objects with {role, content})
      const history = historyIn
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6);

      const payload = {
        user: user
          ? {
              id: String(user.id),
              email: user.email ?? null,
              name: user.name ?? null,
            }
          : null,
        chat_id: chatId ?? null,
        model: model || null,
        user_message: message,
        history,
        settings,
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