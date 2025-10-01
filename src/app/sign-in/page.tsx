"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { User, Mail, Shield, Zap, BarChart3, Send } from "lucide-react";

// ... keep existing code ...
export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { refetch } = useSession();

  // Removed password validation and generatePassword methods as per instructions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await signIn.email({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (error?.code) {
      const errorMap: Record<string, string> = {
        INVALID_CREDENTIALS: "Invalid email or password. Please make sure you have already registered an account and try again.",
      };
      toast.error(errorMap[error.code] || "Sign in failed");
      return;
    }

    toast.success("Signed in successfully!");
    await refetch();
    router.push("/");
  };

  const features = [
    {
      icon: BarChart3,
      title: "AI-Powered Lead Generation",
      description: "Generate high-quality leads tailored to your business needs with our advanced Hesper AI models."
    },
    {
      icon: Send,
      title: "Smart Email Automation",
      description: "Send personalized emails efficiently, with credit-based scaling to match your volume requirements."
    },
    {
      icon: Zap,
      title: "Dual AI Models",
      description: "Choose between Hesper 1.0v for everyday tasks or Hesper Pro for complex business intelligence."
    },
    {
      icon: Shield,
      title: "Secure & Scalable",
      description: "Enterprise-grade security with fair usage credits, ensuring reliable performance for your team."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Marketing Section */}
          <div className="lg:w-1/2 space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-light text-foreground mb-2">Meet Hesper</h1>
              <p className="text-2xl md:text-3xl text-primary mb-6">Your Intelligent Business AI Partner</p>
              <p className="text-muted-foreground text-lg">Revolutionize your workflow with AI that understands your business—generate leads, automate emails, and chat smarter than ever before.</p>
            </div>
            {/* Feature Carousel */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex-none w-64 bg-card rounded-lg p-4 shadow-sm border snap-center">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-secondary rounded-full">
                <div className="h-full bg-primary rounded-full w-1/4 transition-all duration-300" style={{ transform: `translateX(${features.length * 100}%)` }}></div>
              </div>
            </div>
          </div>
          {/* Form Section */}
          <div className="lg:w-1/2 max-w-md">
            <Card className="w-full">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Sign in</CardTitle>
                <CardDescription>
                  Enter your email and password to sign in to your account.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <CardFooter className="flex flex-col space-y-2">
                <Link href="/sign-up" className="text-sm text-center text-primary underline-offset-2 hover:underline">
                  Don&apos;t have an account? <span className="font-medium">Sign up</span>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
// ... rest of code ...