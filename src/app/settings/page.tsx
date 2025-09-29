"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";

export default function SettingsPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // SMTP
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<number | "">("");
  const [clientHostname, setClientHostname] = useState("");
  const [sslTlsEnabled, setSslTlsEnabled] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  // Email Format state
  const [emailTone, setEmailTone] = useState("");
  const [emailDescription, setEmailDescription] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [subjectTemplates, setSubjectTemplates] = useState("");
  const [savingEmailFormat, setSavingEmailFormat] = useState(false);
  
  // Business intro
  const [userNameIntro, setUserNameIntro] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [savingBusinessIntro, setSavingBusinessIntro] = useState(false);
  
  // Business differentiation
  const [pros, setPros] = useState<Array<{ id: number; value: string }>>([]);
  const [differences, setDifferences] = useState<Array<{ id: number; value: string }>>([]);
  const [newPro, setNewPro] = useState("");
  const [newDifference, setNewDifference] = useState("");
  const [addingPro, setAddingPro] = useState(false);
  const [addingDifference, setAddingDifference] = useState(false);

  // Prefill settings from API
  useEffect(() => {
    const load = async () => {
      if (!session?.user) return;
      try {
        const token = localStorage.getItem("bearer_token");
        const res = await fetch("/api/settings/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        // SMTP
        if (data?.smtp_username !== undefined) setSmtpUsername(data.smtp_username || "");
        if (data?.smtp_host !== undefined) setSmtpHost(data.smtp_host || "");
        if (data?.smtp_port !== undefined) setSmtpPort(data.smtp_port ?? "");
        if (data?.client_hostname !== undefined) setClientHostname(data.client_hostname || "");
        if (data?.ssl_tls_enabled !== undefined) setSslTlsEnabled(!!data.ssl_tls_enabled);
        // Email format
        if (data?.email_tone !== undefined) setEmailTone(data.email_tone || "");
        if (data?.email_description !== undefined) setEmailDescription(data.email_description || "");
        if (data?.email_signature !== undefined) setEmailSignature(data.email_signature || "");
        if (data?.subject_templates !== undefined) setSubjectTemplates(data.subject_templates || "");
        // Business intro
        if (data?.user_name !== undefined) setUserNameIntro(data.user_name || "");
        if (data?.business_description !== undefined) setBusinessDescription(data.business_description || "");

        // Pros & Differences lists
        const [prosRes, diffRes] = await Promise.all([
          fetch("/api/settings/pros", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/settings/differences", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (prosRes.ok) {
          const prosData = await prosRes.json();
          if (Array.isArray(prosData)) setPros(prosData);
        }
        if (diffRes.ok) {
          const diffData = await diffRes.json();
          if (Array.isArray(diffData)) setDifferences(diffData);
        }
      } catch {}
    };
    load();
  }, [session]);

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
    const { error } = await signOut();
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

  // Save SMTP settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/settings/smtp", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          smtp_username: smtpUsername || null,
          smtp_password: smtpPassword || null,
          smtp_host: smtpHost || null,
          smtp_port: smtpPort === "" ? null : Number(smtpPort),
          client_hostname: clientHostname || null,
          ssl_tls_enabled: sslTlsEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save SMTP settings");
        return;
      }
      toast.success("SMTP settings saved");
    } catch (error) {
      toast.error("Unexpected error saving SMTP settings");
    } finally {
      setSavingSmtp(false);
    }
  };

  // Save Email Format
  const handleSaveEmailFormat = async () => {
    setSavingEmailFormat(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/settings/email-format", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email_tone: emailTone || null,
          email_description: emailDescription || null,
          email_signature: emailSignature || null,
          subject_templates: subjectTemplates || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save email format");
        return;
      }
      toast.success("Email format saved");
    } catch {
      toast.error("Failed to save email format");
    } finally {
      setSavingEmailFormat(false);
    }
  };

  // Save Business Intro
  const handleSaveBusinessIntro = async () => {
    setSavingBusinessIntro(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/settings/business-intro", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_name: userNameIntro || null,
          business_description: businessDescription || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save business intro");
        return;
      }
      toast.success("Business intro saved");
    } catch {
      toast.error("Failed to save business intro");
    } finally {
      setSavingBusinessIntro(false);
    }
  };

  // Add Business Pro
  const handleAddPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPro.trim()) {
      toast.error("Please enter a pro");
      return;
    }
    setAddingPro(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/settings/pros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newPro.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to add pro");
        return;
      }
      setNewPro("");
      // Refresh list
      try {
        const listRes = await fetch("/api/settings/pros", { headers: { Authorization: `Bearer ${token}` } });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData)) setPros(listData);
        }
      } catch {}
      toast.success("Pro added");
    } catch (error) {
      toast.error("Unexpected error adding pro");
    } finally {
      setAddingPro(false);
    }
  };

  // Add Business Difference
  const handleAddDifference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDifference.trim()) {
      toast.error("Please enter a differentiation point");
      return;
    }
    setAddingDifference(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/settings/differences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newDifference.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to add differentiation");
        return;
      }
      setNewDifference("");
      // Refresh list
      try {
        const listRes = await fetch("/api/settings/differences", { headers: { Authorization: `Bearer ${token}` } });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData)) setDifferences(listData);
        }
      } catch {}
      toast.success("Differentiation added");
    } catch (error) {
      toast.error("Unexpected error adding differentiation");
    } finally {
      setAddingDifference(false);
    }
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

          {/* SMTP Settings */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium">SMTP Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure SMTP so the AI agent can send emails. Only fill fields you want to set.
            </p>
            <form onSubmit={handleSaveSmtp} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-username">SMTP Username</Label>
                <Input id="smtp-username" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input id="smtp-password" type="password" autoComplete="off" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" inputMode="numeric" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-hostname">Client Hostname</Label>
                <Input id="client-hostname" value={clientHostname} onChange={(e) => setClientHostname(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <input id="ssl-tls-enabled" type="checkbox" checked={sslTlsEnabled} onChange={(e) => setSslTlsEnabled(e.target.checked)} />
                <Label htmlFor="ssl-tls-enabled">Enable SSL/TLS</Label>
              </div>
              <Button type="submit" className="w-full" disabled={savingSmtp}>
                {savingSmtp ? "Saving..." : "Save SMTP Settings"}
              </Button>
            </form>
          </div>

          {/* Email Format Configuration */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium">Email Format Configuration</h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-tone">Email Tone</Label>
                <Input id="email-tone" placeholder="friendly, professional, persuasive, casual, etc." value={emailTone} onChange={(e) => setEmailTone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-description">Email Description</Label>
                <textarea id="email-description" className="w-full min-h-[88px] rounded-md border border-border bg-input px-3 py-2 text-sm" value={emailDescription} onChange={(e) => setEmailDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signature">Email Signature</Label>
                <textarea id="email-signature" className="w-full min-h-[88px] rounded-md border border-border bg-input px-3 py-2 text-sm" value={emailSignature} onChange={(e) => setEmailSignature(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-templates">Subject line style / templates (optional)</Label>
                <textarea id="subject-templates" className="w-full min-h-[72px] rounded-md border border-border bg-input px-3 py-2 text-sm" placeholder="One per line or comma-separated" value={subjectTemplates} onChange={(e) => setSubjectTemplates(e.target.value)} />
              </div>
              <Button type="button" onClick={handleSaveEmailFormat} disabled={savingEmailFormat}>
                {savingEmailFormat ? "Saving..." : "Save Email Format"}
              </Button>
              <p className="text-xs text-muted-foreground">Every update sends each field separately to the webhook and is saved in the database.</p>
            </div>
          </div>

          {/* Business Introduction */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium">Business Introduction</h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intro-name">Your Name</Label>
                <Input id="intro-name" value={userNameIntro} onChange={(e) => setUserNameIntro(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-description">Business Full Detailed Description</Label>
                <textarea id="business-description" className="w-full min-h-[120px] rounded-md border border-border bg-input px-3 py-2 text-sm" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} />
              </div>
              <Button type="button" onClick={handleSaveBusinessIntro} disabled={savingBusinessIntro}>
                {savingBusinessIntro ? "Saving..." : "Save Business Intro"}
              </Button>
              <p className="text-xs text-muted-foreground">Updates are saved and sent to the webhook separately per field.</p>
            </div>
          </div>

          {/* Business Differentiation */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium">Business Differentiation</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Pros of Your Business</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Input placeholder="Add a pro" value={newPro} onChange={(e) => setNewPro(e.target.value)} />
                  <Button type="button" onClick={handleAddPro}>Add</Button>
                </div>
                <ul className="space-y-2">
                  {pros.map((p) => (
                    <li key={p.id} className="text-sm text-foreground/90 bg-card border border-border rounded-md px-3 py-2">{p.value}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">How You Differ From Others (USP points)</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Input placeholder="Add a differentiation" value={newDifference} onChange={(e) => setNewDifference(e.target.value)} />
                  <Button type="button" onClick={handleAddDifference}>Add</Button>
                </div>
                <ul className="space-y-2">
                  {differences.map((d) => (
                    <li key={d.id} className="text-sm text-foreground/90 bg-card border border-border rounded-md px-3 py-2">{d.value}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Each new entry is saved and the value is sent to the webhook as a separate string.</p>
          </div>
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