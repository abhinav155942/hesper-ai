"use client";

import { Zap, Brain, Crown, MessageCircle, Clock, Shield, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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

  const crmData = [
    { name: 'Automated', value: 80 },
    { name: 'Manual', value: 20 },
  ];
  const aiData = [
    { name: 'Deep', value: 90 },
    { name: 'Basic', value: 10 },
  ];
  const COLORS = ['#10B981', '#6B7280'];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-normal mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent">
            About Hesper
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple AI models for your needs. Pick what fits best.
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
              Fast AI for daily help. Example: Quick answers to "What's the weather?"
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
                    Simple questions, writing help, basic math. Example: "Summarize this article."
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
              Smart AI that thinks deeply. Example: "Plan a full marketing strategy."
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
                    Tough problems, research, planning. Example: "Analyze market trends."
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium text-sm text-amber-800 mb-2">
                🧠 Advanced Capabilities
              </h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Step-by-step thinking</li>
                <li>• Fact-checking research</li>
                <li>• Business strategies</li>
                <li>• Data insights</li>
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
                  <td className="text-center py-3"><span className="font-bold">30 messages</span></td>
                  <td className="text-center py-3"><span className="font-bold">3 messages</span></td>
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
                  <td className="text-center py-3">Quick help</td>
                  <td className="text-center py-3">Deep work</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Hesper Pro Agent Capabilities Card */}
        <div className="bg-card rounded-xl border border-border p-8 mb-12">
          <h2 className="text-2xl font-medium mb-6 text-center">Hesper Pro: Your Advanced AI Agent</h2>
          
          <p className="text-muted-foreground mb-6 text-center">
            Hesper Pro acts as a versatile AI agent, handling complex workflows beyond basic chat.
          </p>

          <div className="border border-black p-6 rounded-lg mb-6">
            <ul className="text-sm space-y-2">
              <li>• Lead finding and generation</li>
              <li>• Bulk or targeted email sending with custom intervals (e.g., 2-min gaps)</li>
              <li>• Web search and deep research planning</li>
              <li>• Realtime data analysis</li>
              <li>• Plus all standard AI capabilities: writing, coding, calculations</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Automate smartly with full control.
          </p>
        </div>

        {/* Credits Deduction System - NEW SECTION */}
        <div className="bg-card rounded-xl border border-border p-8 mb-12 mt-8">
          <h2 className="text-2xl font-medium mb-6 text-center">Credits Deduction System</h2>
          
          <p className="text-muted-foreground mb-6 text-center">
            One pool of credits for all tools. Rates match effort needed.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Leads Generation */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-sm mb-2">Lead Generation</h3>
              <p className="text-xs text-blue-800 mb-2">Generate targeted leads efficiently.</p>
              <div className="bg-white rounded p-2 border border-black">
                <p className="text-xs font-medium">10 leads = 5 credits</p>
              </div>
            </div>

            {/* Email Sending */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-medium text-sm mb-2">Email Sending</h3>
              <p className="text-xs text-green-800 mb-2">Send bulk emails with ease.</p>
              <div className="bg-white rounded p-2 border border-black">
                <p className="text-xs font-medium">15 emails = 5 credits</p>
              </div>
            </div>

            {/* Model Messaging - Hesper 1.0v */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="font-medium text-sm mb-2">Hesper 1.0v Messaging</h3>
              <p className="text-xs text-indigo-800 mb-2">Fast, general AI interactions.</p>
              <div className="bg-white rounded p-2 border border-black">
                <p className="text-xs font-medium">20 messages = 5 credits</p>
              </div>
            </div>

            {/* Model Messaging - Hesper Pro */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h3 className="font-medium text-sm mb-2">Hesper Pro Messaging</h3>
              <p className="text-xs text-amber-800 mb-2">Advanced reasoning and research.</p>
              <div className="bg-white rounded p-2 border border-black">
                <p className="text-xs font-medium">12 messages = 8 credits</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Daily caps per model. Credits last forever—use across all!
          </p>
        </div>

        {/* Hesper vs Normal CRMs & AI */}
        <div className="bg-card rounded-xl border border-border p-8 mb-12">
          <h2 className="text-2xl font-medium mb-6 text-center">Hesper vs Normal CRMs & AI</h2>
          
          <p className="text-muted-foreground mb-6 text-center">
            Hesper saves time and boosts results compared to traditional tools. Example: Generate 10 qualified leads in minutes, not hours.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            {/* CRM Comparison */}
            <div>
              <h3 className="font-medium mb-4 text-center">Task Automation</h3>
              <div className="flex gap-2 justify-center mb-2">
                <div className="text-xs border border-black p-1 rounded">Normal CRM: 40% Automated</div>
                <div className="text-xs bg-green-100 border border-black p-1 rounded">Hesper: 80% Automated</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={crmData} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value">
                    {crmData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-center mt-2">Example: Manual data entry vs Hesper's auto-lead finding.</p>
            </div>

            {/* AI Comparison */}
            <div>
              <h3 className="font-medium mb-4 text-center">Research Depth</h3>
              <div className="flex gap-2 justify-center mb-2">
                <div className="text-xs border border-black p-1 rounded">Normal AI: 50% Deep</div>
                <div className="text-xs bg-green-100 border border-black p-1 rounded">Hesper Pro: 90% Deep</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={aiData} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value">
                    {aiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-center mt-2">Example: Basic summaries vs Pro's multi-step analysis.</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="text-center bg-primary/5 rounded-xl p-8 border border-primary/20">
          <h2 className="text-xl font-medium mb-4">Want More Messages?</h2>
          <p className="text-muted-foreground mb-6">
            Get more with paid plans.
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
              <li>• No training on your chats</li>
              <li>• Auto-delete inactive sessions</li>
              <li>• Limits for smooth use</li>
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">Latency & Limits</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• 1.0v: 1-3s fast</li>
              <li>• Pro: 10-30s deep think</li>
              <li>• Reset at midnight UTC</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">Roadmap</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• File Q&A</li>
              <li>• Image analysis</li>
              <li>• Team sharing</li>
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium mb-3">FAQ</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">How do credits work?</p>
                <p>Shared pool for leads, emails, chats. Example: 10 leads = 5 credits, like 20 fast messages.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">When to use Pro?</p>
                <p>For deep tasks. Fast model for simple stuff. Pro costs more credits but gives better results.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">What if I run out?</p>
                <p>Hit daily limits. Buy more anytime—no stops, just upgrade.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Questions? 
            <a href="mailto:support@hesper.ai" className="text-primary hover:underline ml-1">
              Email support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}