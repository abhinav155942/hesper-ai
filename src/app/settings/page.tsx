"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";

export default function SettingsPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/sign-in?redirect=/settings");
      } else {
        setName(session.user.name || "");
      }
    }
  }, [session, isPending, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/user/name", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to update name");
        return;
      }
      toast.success("Name updated");
      await refetch();
    } catch (err) {
      toast.error("Unexpected error updating name");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
      setSigningOut(false);
      return;
    }
    localStorage.removeItem("bearer_token");
    await refetch();
    setSigningOut(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Settings</CardTitle>
          <CardDescription>Manage your account preferences.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button variant="destructive" onClick={handleSignOut} disabled={signingOut} className="w-full">
            {signingOut ? "Signing out..." : "Log out"}
          </Button>
          {!session?.user?.emailVerified && (
            <p className="text-xs text-muted-foreground text-center">
              Your email is not verified yet. Please check your inbox.
            </p>
          )}
          <Link href="/" className="text-sm text-center text-primary underline-offset-2 hover:underline">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}