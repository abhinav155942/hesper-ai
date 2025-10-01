"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { User, Mail, Shield, Zap, BarChart3, Send } from "lucide-react";

export default function SignUpPage() {
  const { refetch } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Password must be at least 8 characters long.");
    if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number.");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("Password must contain at least one special character.");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error("Set your password more strong: " + passwordErrors.join(", "));
      return;
    }
    setLoading(true);

    const { data, error } = await signUp.email({
      email: formData.email,
      name: formData.name,
      password: formData.password,
    });

    setLoading(false);

    if (error?.code) {
      const errorMap: Record<string, string> = {
        USER_ALREADY_EXISTS: "Email already registered",
      };
      toast.error(errorMap[error.code] || "Registration failed");
      return;
    }

    toast.success("Account created and signed in successfully!");
    await refetch();
    router.push("/");
  };

  // Auto-check requirements
  const passwordChecks = [
    { label: "At least 8 characters", check: formData.password.length >= 8 },
    { label: "Contains a number", check: /[0-9]/.test(formData.password) },
    { label: "Contains a special character", check: /[!@#$%^&*(),.?\":{}|<>]/.test(formData.password) },
  ];

  const allChecksPass = passwordChecks.every(check => check.check);

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
              <h1 className="text-4xl md:text-5xl font-light text-foreground mb-2">Join Hesper</h1>
              <p className="text-2xl md:text-3xl text-primary mb-6">Unlock AI for Your Business</p>
              <p className="text-muted-foreground text-lg">Get started today and transform how you generate leads, communicate, and grow with intelligent AI tools built for efficiency.</p>
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
            </div>
          </div>
          {/* Form Section */}
          <div className="lg:w-1/2 max-w-md">
            <Card className="w-full">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Sign up</CardTitle>
                <CardDescription>
                  Create a new account to get started with Hesper.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="h-4 w-4 inline mr-2" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
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
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                    required
                  />
                  {/* Password Requirements */}
                  <div className={`mt-2 p-2 bg-muted/50 rounded-md text-sm ${allChecksPass ? 'text-green-600' : 'text-destructive'}`}>
                    <ul className="space-y-1">
                      {passwordChecks.map((check, idx) => (
                        <li key={idx} className={`flex items-center gap-2 ${check.check ? 'text-green-600' : 'text-destructive'}`}>
                          {check.check ? '✓' : '✗'} {check.label}
                        </li>
                      ))}
                    </ul>
                    {!allChecksPass && <p className="mt-1 font-medium">Password must be more than 8 digits and strong</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || formData.password !== formData.confirmPassword || !allChecksPass}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
              <CardFooter className="flex flex-col space-y-2">
                <Link href="/sign-in" className="text-sm text-center text-primary underline-offset-2 hover:underline">
                  Already have an account? <span className="font-medium">Sign in</span>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}