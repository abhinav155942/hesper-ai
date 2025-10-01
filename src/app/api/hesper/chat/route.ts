import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettingsKeyValueLines } from "@/lib/settings-helpers";
import { getUserSettingsJson } from "@/lib/settings-helpers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

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
    const currentUser = await getCurrentUser(req);
    const userId = currentUser?.id ? String(currentUser.id) : "anon";

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
        if (currentUser?.id) {
          settings = await getUserSettingsJson(String(currentUser.id));
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
        sendgrid: {
          api_key: null as string | null,
          domain: null as string | null,
        },
        mailgun: {
          api_key: null as string | null,
          domain: null as string | null,
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
        sendgrid: { ...defaultSettings.sendgrid, ...(settings?.sendgrid || {}) },
        mailgun: { ...defaultSettings.mailgun, ...(settings?.mailgun || {}) },
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

      // Check daily message limits and credit deduction for authenticated users
      if (currentUser?.id) {
        const userRecord = await db.select({
          credits: user.credits,
          subscriptionPlan: user.subscriptionPlan,
          basicMessageCount: user.basicMessageCount,
          proMessageCount: user.proMessageCount,
          dailyBasicMessages: user.dailyBasicMessages,
          dailyProMessages: user.dailyProMessages,
          basicDailyLimit: user.basicDailyLimit,
          proDailyLimit: user.proDailyLimit,
          lastResetDate: user.lastResetDate
        })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        if (userRecord.length === 0) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userRecord[0];
        const currentCredits = userData.credits ?? 0;
        const subscriptionPlan = userData.subscriptionPlan || 'free';
        let dailyBasicMessages = userData.dailyBasicMessages ?? 0;
        let dailyProMessages = userData.dailyProMessages ?? 0;
        let basicMessageCount = userData.basicMessageCount ?? 0;
        let proMessageCount = userData.proMessageCount ?? 0;
        const basicDailyLimit = userData.basicDailyLimit ?? 30;
        const proDailyLimit = userData.proDailyLimit ?? 3;
        const lastResetDate = userData.lastResetDate;

        // Handle daily message reset if it's a new day
        const today = new Date().toDateString();
        let needsDailyReset = false;
        
        if (lastResetDate !== today) {
          needsDailyReset = true;
          dailyBasicMessages = 0;
          dailyProMessages = 0;
          
          await db.update(user)
            .set({ 
              dailyBasicMessages: 0,
              dailyProMessages: 0,
              lastResetDate: today,
              updatedAt: new Date() 
            })
            .where(eq(user.id, userId));
        }

        // Model-specific logic
        let creditsToDeduct = 0;
        let messageCountUpdate: any = {};
        let dailyCountUpdate: any = {};

        if (model === 'hesper-1.0v' || !model) {
          // Basic model: Check daily limit
          if (dailyBasicMessages >= basicDailyLimit) {
            return Response.json({ 
              error: `Daily limit of ${basicDailyLimit} messages for Hesper 1.0v reached.` 
            }, { status: 402 });
          }

          const newBasicDaily = dailyBasicMessages + 1;
          const newBasicLifetime = basicMessageCount + 1;
          
          dailyCountUpdate.dailyBasicMessages = newBasicDaily;
          messageCountUpdate.basicMessageCount = newBasicLifetime;

          // Deduct 1 credit every 4 messages
          if (newBasicLifetime % 4 === 0) {
            creditsToDeduct = 1;
            if (currentCredits < creditsToDeduct) {
              return Response.json({ 
                error: `Insufficient credits. Need ${creditsToDeduct}, have ${currentCredits}.`,
                credits: currentCredits,
                required: creditsToDeduct
              }, { status: 402 });
            }
          }
        } else if (model === 'hesper-pro') {
          // Pro model: Check daily limit
          if (dailyProMessages >= proDailyLimit) {
            return Response.json({ 
              error: `Daily limit of ${proDailyLimit} messages for Hesper Pro reached.` 
            }, { status: 402 });
          }

          const newProDaily = dailyProMessages + 1;
          const newProLifetime = proMessageCount + 1;
          
          dailyCountUpdate.dailyProMessages = newProDaily;
          messageCountUpdate.proMessageCount = newProLifetime;

          // Deduct 2 credits every 3 messages for Pro
          if (newProLifetime % 3 === 0) {
            creditsToDeduct = 2;
            if (currentCredits < creditsToDeduct) {
              return Response.json({ 
                error: `Insufficient credits for Hesper Pro. Need ${creditsToDeduct}, have ${currentCredits}.`,
                credits: currentCredits,
                required: creditsToDeduct
              }, { status: 402 });
            }
          }
        }

        // Call N8N...
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
        let status = upstream.status;
        let text = await upstream.text();

        if (upstream.ok) {
          // Update user after successful response
          const updates: any = {
            updatedAt: new Date(),
            ...messageCountUpdate,
            ...dailyCountUpdate
          };

          // Deduct credits if needed
          if (creditsToDeduct > 0) {
            updates.credits = currentCredits - creditsToDeduct;
          }

          await db.update(user)
            .set(updates)
            .where(eq(user.id, userId))
            .execute();
        }

        const data = { text, status, contentType };
        // Set short cache window to absorb immediate duplicates
        cache.set(key, { data, expires: now + CACHE_TTL_MS });
        return data;
      } else {
        // Unauth flow
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
        cache.set(key, { data, expires: now + CACHE_TTL_MS });
        return data;
      }
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