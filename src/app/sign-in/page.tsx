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

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const { refetch } = useSession();

  const isValidPassword = (password: string): boolean => {
    const lengthCheck = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(password);
    return lengthCheck && hasNumber && hasSpecial;
  };

  const generatePassword = (): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specials = "!@#$%^&*()_+{}[]:;<>,.?/~`";
    const allChars = uppercase + lowercase + numbers + specials;
    let password = "";
    // Ensure one of each required
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specials.charAt(Math.floor(Math.random() * specials.length));
    // Fill remaining to 12 chars
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    // Shuffle
    return password.split("").sort(() => Math.random() - 0.5).join("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    if (newPassword) {
      if (!isValidPassword(newPassword)) {
        setPasswordError("Password must be at least 8 characters, contain a number, and a special character.");
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({ 
      ...formData, 
      password: newPassword 
    });
    setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && !isValidPassword(formData.password)) {
      toast.error("Password must meet the requirements.");
      return;
    }
    setLoading(true);

    const { data, error } = await signIn.email({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (error?.code) {
      toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
      return;
    }

    toast.success("Signed in successfully!");
    await refetch();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to sign in to your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
                className={passwordError ? "border-destructive" : ""}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleGeneratePassword}>
                Generate
              </Button>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/sign-up" className="text-sm text-center text-primary underline-offset-2 hover:underline">
            Don&apos;t have an account? Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}