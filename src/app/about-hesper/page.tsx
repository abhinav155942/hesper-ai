"use client";

import { Zap, Brain, Crown, MessageCircle, Clock, Shield, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function AboutHesperPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [expiry, setExpiry] = useState<number | null>(null);

  const proDailyLimit = useMemo(() => (isPaid ? 50 : 3), [isPaid]);
  const v1DailyLimit = useMemo(() => (isPaid ? 100 : 30), [isPaid]);

  const hesperProRemaining = useMemo(() => {
    if (credits == null) return null;
    return Math.max(0, Math.min(credits, proDailyLimit));
  }, [credits, proDailyLimit]);

  const hesperV1Remaining = useMemo(() => {
    if (credits == null) return null;
    return Math.max(0, Math.min(credits, v1DailyLimit));
  }, [credits, v1DailyLimit]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [subRes, credRes] = await Promise.all([
        fetch("/api/user/subscription", { headers }),
        fetch("/api/user/credits", { headers }),
      ]);

      if (!subRes.ok) {
        // Treat unauthenticated as free plan
        if (subRes.status !== 401) {
          const errText = await subRes.text();
          console.error("Subscription fetch error:", errText);
        }
        setIsPaid(false);
        setExpiry(null);
      } else {
        const sub = await subRes.json();
        const exp = sub?.subscriptionExpiry ? Number(new Date(sub.subscriptionExpiry).getTime()) : null;
        const now = Date.now();
        const active = !!sub?.subscriptionPlan && (!exp || exp > now);
        setIsPaid(active);
        setExpiry(exp);
      }

      if (!credRes.ok) {
        if (credRes.status === 401) {
          // unauthenticated: no credits info
          setCredits(null);
        } else {
          const errText = await credRes.text();
          throw new Error(errText || "Failed to load credits");
        }
      } else {
        const c = await credRes.json();
        setCredits(typeof c?.credits === "number" ? c.credits : null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load usage");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when opening the popover for the first time
  useEffect(() => {
    if (open && credits == null && !loading) {
      fetchUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-normal mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent">
            About Hesper
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meet our AI models designed to assist you in different ways. Choose the right model for your needs.
          </p>
          {/* View usage button */}
          <div className="mt-4 flex justify-center">
            <div
              className="relative"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                View messages
              </button>
              {open && (
                <div className="absolute left-1/2 z-50 mt-2 w-[260px] -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-sm shadow-sm">
                  {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                  ) : error ? (
                    <div className="text-destructive">{error}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">{isPaid ? "Paid" : "Free"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Credits</span>
                        <span className="font-medium">{credits ?? "—"}</span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex items-center justify-between">
                        <span>Hesper Pro</span>
                        <span className="font-medium">
                          {hesperProRemaining == null ? "—" : `${hesperProRemaining} remaining`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hesper 1.0v</span>
                        <span className="font-medium">
                          {hesperV1Remaining == null ? "—" : `${hesperV1Remaining} remaining`}
                        </span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <p className="text-xs">
                        {`Hesper Pro = ${hesperProRemaining ?? "—"} messages remaining / Hesper 1.0v = ${hesperV1Remaining ?? "—"} messages remaining.`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shown as min(credits, daily model limit). Daily limits reset at midnight UTC.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Model Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Hesper 1.0v Card */}
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-medium">Hesper 1.0v</h2>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  Free Model
                </span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Our foundational AI model designed for fast, reliable responses and general assistance. 
              Perfect for everyday tasks and quick answers.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Usage Limits</h3>
                  <p className="text-xs text-muted-foreground">
                    • Free users: 30 messages per day<br/>
                    • Paid subscribers: 100 messages per day
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Response Speed</h3>
                  <p className="text-xs text-muted-foreground">
                    Optimized for fast responses (typically under 3 seconds)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Best For</h3>
                  <p className="text-xs text-muted-foreground">
                    General questions, writing assistance, quick calculations, 
                    basic research, and everyday AI interactions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hesper Pro Card */}
          <div className="bg-card rounded-xl border border-amber-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Brain className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-medium">Hesper Pro</h2>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                  <Crown className="h-3 w-3" />
                  Pro Model
                </span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Our advanced AI model with enhanced reasoning and research capabilities. 
              Takes time to think through complex problems before providing responses.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Usage Limits</h3>
                  <p className="text-xs text-muted-foreground">
                    • Free users: 3 messages per day<br/>
                    • Paid subscribers: 50 messages per day
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Response Approach</h3>
                  <p className="text-xs text-muted-foreground">
                    Takes time to research and reason before responding (10-30 seconds)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Best For</h3>
                  <p className="text-xs text-muted-foreground">
                    Complex analysis, research tasks, strategic planning, 
                    detailed explanations, and problems requiring deep reasoning
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium text-sm text-amber-800 mb-2">
                🧠 Advanced Capabilities
              </h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Multi-step reasoning and problem solving</li>
                <li>• In-depth research and fact verification</li>
                <li>• Strategic analysis and planning</li>
                <li>• Complex data interpretation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-card rounded-xl border border-border p-8 mb-12">
          <h2 className="text-2xl font-medium mb-6 text-center">Model Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 font-medium">Feature</th>
                  <th className="text-center pb-3 font-medium">Hesper 1.0v</th>
                  <th className="text-center pb-3 font-medium">Hesper Pro</th>
                </tr>
              </thead>
              <tbody className="space-y-3">
                <tr className="border-b border-border/50">
                  <td className="py-3 font-medium">Response Speed</td>
                  <td className="text-center py-3 text-green-600">Fast (1-3s)</td>
                  <td className="text-center py-3 text-amber-600">Thoughtful (10-30s)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 font-medium">Free Daily Limit</td>
                  <td className="text-center py-3">30 messages</td>
                  <td className="text-center py-3">3 messages</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 font-medium">Paid Daily Limit</td>
                  <td className="text-center py-3">100 messages</td>
                  <td className="text-center py-3">50 messages</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 font-medium">Reasoning Depth</td>
                  <td className="text-center py-3">Standard</td>
                  <td className="text-center py-3">Advanced</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 font-medium">Research Capabilities</td>
                  <td className="text-center py-3">Basic</td>
                  <td className="text-center py-3">Comprehensive</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Best Use Cases</td>
                  <td className="text-center py-3">Quick answers, general help</td>
                  <td className="text-center py-3">Complex analysis, planning</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Credits Deduction System - NEW SECTION */}
        <div className="bg-card rounded-xl border border-border p-8 mb-12 mt-8">
          <h2 className="text-2xl font-medium mb-6 text-center">Credits Deduction System</h2>
          
          <p className="text-muted-foreground mb-6 text-center">
            Credits are your unified currency for all Hesper features. While credits are shared across actions, the deduction rates differ based on each feature's computational expense and resource use. This ensures fair pricing for more intensive tasks.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Leads Generation */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-sm mb-2">Lead Generation</h3>
              <p className="text-xs text-blue-800 mb-2">Generate targeted leads efficiently.</p>
              <div className="bg-white rounded p-2">
                <p className="text-xs font-medium">10 leads = 5 credits</p>
              </div>
            </div>

            {/* Email Sending */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-medium text-sm mb-2">Email Sending</h3>
              <p className="text-xs text-green-800 mb-2">Send bulk emails with ease.</p>
              <div className="bg-white rounded p-2">
                <p className="text-xs font-medium">15 emails = 5 credits</p>
              </div>
            </div>

            {/* Model Messaging - Hesper 1.0v */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="font-medium text-sm mb-2">Hesper 1.0v Messaging</h3>
              <p className="text-xs text-indigo-800 mb-2">Fast, general AI interactions.</p>
              <div className="bg-white rounded p-2">
                <p className="text-xs font-medium">20 messages = 5 credits</p>
              </div>
            </div>

            {/* Model Messaging - Hesper Pro */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h3 className="font-medium text-sm mb-2">Hesper Pro Messaging</h3>
              <p className="text-xs text-amber-800 mb-2">Advanced reasoning and research.</p>
              <div className="bg-white rounded p-2">
                <p className="text-xs font-medium">12 messages = 8 credits</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Note: Daily message limits (free/paid) cap usage per model, while credits deduct based on these rates. Credits do not expire and are shared—use them wisely across features!
          </p>
        </div>

        {/* Subscription Info */}
        <div className="text-center bg-primary/5 rounded-xl p-8 border border-primary/20">
          <h2 className="text-xl font-medium mb-4">Want More Messages?</h2>
          <p className="text-muted-foreground mb-6">
            Upgrade to a paid subscription to unlock higher daily limits for both models.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/checkout"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View Pricing Plans
            </a>
            <a 
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Try Hesper Now
            </a>
          </div>
        </div>

        {/* Extra Info Sections */}
        <div className="grid gap-6 md:grid-cols-2 mt-12">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">Reliability & Privacy</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• We do not train on your personal chats.</li>
              <li>• Sessions auto-expire after inactivity to protect your data.</li>
              <li>• Rate limiting keeps the service stable across models.</li>
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">Latency & Limits</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Hesper 1.0v: 1–3s typical latency</li>
              <li>• Hesper Pro: 10–30s thoughtful responses</li>
              <li>• Daily quotas reset at midnight UTC</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">Roadmap</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• File uploads and document Q&A</li>
              <li>• Image understanding and visual reasoning</li>
              <li>• Workspace sharing and team plans</li>
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">FAQ</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">How do credits work across features?</p>
                <p>Credits are a single pool for all actions (leads, emails, messaging). Deductions vary by feature—e.g., 10 leads or 20 Hesper 1.0v messages cost 5 credits, while Hesper Pro is more expensive per message due to advanced processing.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Is Pro required for complex tasks?</p>
                <p>Not always. Start with 1.0v for quick help; upgrade to Pro for deeper reasoning or research. Credits deduct differently, so Pro uses more for its enhanced capabilities.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Do messages roll over?</p>
                <p>No. Daily limits reset at midnight UTC, but unused credits carry over indefinitely. Focus on high-value actions to maximize value.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">What happens if I run out of credits?</p>
                <p>You'll hit your daily limits or see a low-balance warning. Purchase more via subscriptions or add-ons—no interruptions, just plan ahead for intensive use.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Are credits shared between models?</p>
                <p>Yes, credits are universal. The key difference: Hesper 1.0v gives more messages per credit (20 for 5), while Pro offers quality at a premium (12 for 8), matching their respective strengths.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Have questions about our models? 
            <a href="mailto:support@hesper.ai" className="text-primary hover:underline ml-1">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}