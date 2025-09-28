"use client";

import { Zap, Brain, Crown, MessageCircle, Clock, Shield, Sparkles } from "lucide-react";

export default function AboutHesperPage() {
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
                <p className="font-medium text-foreground">Is Pro required for complex tasks?</p>
                <p>Not always. Start with 1.0v; upgrade when you need deeper reasoning or research.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Do messages roll over?</p>
                <p>No. Limits reset daily to keep usage fair for everyone.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Can I switch models mid‑chat?</p>
                <p>Yes. You can switch anytime; behavior adapts immediately to your selection.</p>
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