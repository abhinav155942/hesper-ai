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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [smtpPort, setSmtpPort] = useState<string>("");  // Changed to string
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

  // New states for providers
  const [emailProvider, setEmailProvider] = useState<'smtp' | 'sendgrid' | 'mailgun'>('smtp');
  const [sendgridApiKey, setSendgridApiKey] = useState("");
  const [sendgridDomainEmail, setSendgridDomainEmail] = useState("");
  const [mailgunApiKey, setMailgunApiKey] = useState("");
  const [mailgunDomainEmail, setMailgunDomainEmail] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  // Set name from session
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  // Prefill settings from API
  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return; // Add check for user.id
      try {
        const token = localStorage.getItem("bearer_token");
        if (!token) {
          console.error("No bearer token found");
          return;
        }
        const res = await fetch("/api/settings/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.error("Failed to fetch settings:", await res.text());
          return;
        }
        const data = await res.json();
        // SMTP
        if (data?.smtp_username !== undefined) setSmtpUsername(data.smtp_username || "");
        if (data?.smtp_host !== undefined) setSmtpHost(data.smtp_host || "");
        if (data?.smtp_port !== undefined) setSmtpPort(data.smtp_port?.toString() ?? "");
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

        // Email provider settings
        if (data?.email_provider !== undefined) setEmailProvider(data.email_provider as 'smtp' | 'sendgrid' | 'mailgun' || 'smtp');
        if (data?.sendgrid_domain_email !== undefined) setSendgridDomainEmail(data.sendgrid_domain_email || "");
        if (data?.mailgun_domain_email !== undefined) setMailgunDomainEmail(data.mailgun_domain_email || "");
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
          smtp_port: smtpPort ? Number(smtpPort) : null,
          client_hostname: clientHostname || null,
          ssl_tls_enabled: sslTlsEnabled,
          sendgrid_api_key: sendgridApiKey || null,
          sendgrid_domain_email: sendgridDomainEmail || null,
          mailgun_api_key: mailgunApiKey || null,
          mailgun_domain_email: mailgunDomainEmail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save email settings");
        return;
      }
      toast.success("Email settings saved");
    } catch (error) {
      toast.error("Unexpected error saving email settings");
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

  // Add Business Pro - removed e param
  const handleAddPro = async () => {
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

  // Add Business Difference - removed e param
  const handleAddDifference = async () => {
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Settings</CardTitle>
          <CardDescription>Manage your account preferences.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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

          {/* Email Provider Settings */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium">Email Provider Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your preferred email provider so the AI agent can send emails. Recommended options vary by use case.
            </p>
            <Tabs defaultValue="smtp" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="smtp" className="flex items-center justify-start gap-2">
                  <img 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/9b7010da-fc27-4841-a42d-13aebe0f0022/generated_images/simple-vector-icon-of-an-envelope-for-lo-7b8cd42c-20250930080757.jpg?" 
                    alt="SMTP" 
                    className="w-5 h-5" 
                  />
                  Local SMTP
                </TabsTrigger>
                <TabsTrigger value="sendgrid" className="flex items-center justify-start gap-2">
                  <img 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/9b7010da-fc27-4841-a42d-13aebe0f0022/generated_images/sendgrid-official-logo%2c-vector-illustr-c33fd9bd-20250930080809.jpg?" 
                    alt="SendGrid" 
                    className="w-5 h-5" 
                  />
                  SendGrid
                </TabsTrigger>
                <TabsTrigger value="mailgun" className="flex items-center justify-start gap-2">
                  <img 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/9b7010da-fc27-4841-a42d-13aebe0f0022/generated_images/mailgun-official-logo%2c-vector-illustra-276ff2cf-20250930080823.jpg?" 
                    alt="Mailgun" 
                    className="w-5 h-5" 
                  />
                  Mailgun
                </TabsTrigger>
              </TabsList>

              <TabsContent value="smtp" className="mt-4 space-y-4">
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Instant setup and can be proceeded immediately without needing any domain email configuration. However, this option is not ideal for large-scale outreach campaigns.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">SMTP Username</Label>
                    <Input id="smtp-username" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} placeholder="e.g., your-email@gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <Input id="smtp-password" type="password" autoComplete="off" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="App password or SMTP password" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="e.g., smtp.gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input id="smtp-port" inputMode="numeric" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587 or 465" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-hostname">Client Hostname (Optional)</Label>
                    <Input id="client-hostname" value={clientHostname} onChange={(e) => setClientHostname(e.target.value)} placeholder="e.g., yourdomain.com" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input id="ssl-tls-enabled" type="checkbox" checked={sslTlsEnabled} onChange={(e) => setSslTlsEnabled(e.target.checked)} />
                    <Label htmlFor="ssl-tls-enabled">Enable SSL/TLS</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sendgrid" className="mt-4 space-y-4">
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Requires API key and domain email configuration. Recommended for outreach campaigns due to high deliverability and analytics features.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
                    <Input id="sendgrid-api-key" type="password" autoComplete="off" value={sendgridApiKey} onChange={(e) => setSendgridApiKey(e.target.value)} placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-domain-email">Domain Email</Label>
                    <Input id="sendgrid-domain-email" type="email" value={sendgridDomainEmail} onChange={(e) => setSendgridDomainEmail(e.target.value)} placeholder="e.g., noreply@yourdomain.com" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mailgun" className="mt-4 space-y-4">
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Requires API key and domain email configuration. Recommended for outreach campaigns with excellent deliverability and detailed reporting.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mailgun-api-key">Mailgun API Key</Label>
                    <Input id="mailgun-api-key" type="password" autoComplete="off" value={mailgunApiKey} onChange={(e) => setMailgunApiKey(e.target.value)} placeholder="key-xxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mailgun-domain-email">Domain Email</Label>
                    <Input id="mailgun-domain-email" type="email" value={mailgunDomainEmail} onChange={(e) => setMailgunDomainEmail(e.target.value)} placeholder="e.g., noreply@yourdomain.com" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <form onSubmit={handleSaveSmtp}>
              <Button type="submit" className="w-full mt-6" disabled={savingSmtp}>
                {savingSmtp ? "Saving..." : "Save Email Provider Settings"}
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
              <p className="text-xs text-muted-foreground">Every update sends each field separately to the server and is saved in the database.</p>
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
              <p className="text-xs text-muted-foreground">Updates are saved and sent to the server separately per field.</p>
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
            <p className="text-xs text-muted-foreground">Each new entry is saved and the value is sent to the server as a separate string.</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button variant="destructive" onClick={handleSignOut} disabled={signingOut} className="w-full">
            {signingOut ? "Signing out..." : "Log out"}
          </Button>
          <Link href="/" className="text-sm text-center text-primary underline-offset-2 hover:underline">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}