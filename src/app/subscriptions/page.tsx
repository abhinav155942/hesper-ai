"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Subscription {
  plan: "free" | "basic" | "pro";
  expiry?: string | null;
}

const plans = [
{
  id: "basic",
  name: "Hesper 1.0v (Basic)",
  price: "$14.99",
  description: "100 credits/month, access to basic model features",
  credits: "100 credits added",
  apiPath: "basic"
},
{
  id: "pro",
  name: "Hesper Pro",
  price: "$29.99",
  description: "200 credits/month, 50 messages/day, advanced reasoning & research",
  credits: "200 credits & 50 messages/day",
  apiPath: "pro"
}] as
const;

export default function SubscriptionsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string | undefined;
  const effectiveClientId = paypalClientId ?? "test"; // fallback to PayPal sandbox demo client-id so buttons render
  const basicPlanId = process.env.NEXT_PUBLIC_PAYPAL_BASIC_PLAN_ID as string | undefined;
  const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID as string | undefined;
  const planIdMap: Record<string, string | undefined> = {
    basic: basicPlanId,
    pro: proPlanId
  };
  const subscriptionsEnabled = !!(basicPlanId || proPlanId);

  // Log PayPal environment hints at runtime (non-sensitive)
  useEffect(() => {
    if (paypalClientId) {
      // Log only a short prefix to avoid exposing the full key
      console.log("[PayPal] Client ID prefix:", paypalClientId.slice(0, 10));
    } else {
      console.warn("[PayPal] NEXT_PUBLIC_PAYPAL_CLIENT_ID is missing — falling back to sandbox demo client-id");
    }
  }, [paypalClientId]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchSubscription();
    }
  }, [sessionLoading]);

  const fetchSubscription = async () => {
    if (!session?.user) {setLoading(false);return;}
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/user/subscription", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map API response { subscriptionPlan, subscriptionExpiry } -> { plan, expiry }
        setSubscription({
          plan: (data.subscriptionPlan ?? data.plan ?? "free") as Subscription["plan"],
          expiry: data.subscriptionExpiry ?? data.expiry ?? null
        });
      }
    } catch (err) {
      toast.error("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (planApiPath: string) => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error("Please sign in to subscribe");
        router.push("/sign-in?redirect=/subscriptions");
        throw new Error("Not authenticated");
      }
      const res = await fetch(`/api/subscribe/${planApiPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create order");
      }
      const { orderID } = await res.json();
      if (!orderID) throw new Error("Order ID missing from response");
      setOrderId(orderID);
      console.log("[PayPal] Created order:", orderID);
      return orderID as string;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order creation failed");
      throw err instanceof Error ? err : new Error("Order creation failed");
    }
  };

  const onApprove = async (data: any, planApiPath: string) => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error("Please sign in to complete subscription");
        router.push("/sign-in?redirect=/subscriptions");
        return;
      }
      const res = await fetch(`/api/subscribe/capture/${planApiPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderID: data.orderID })
      });
      console.log("[PayPal] Approved order:", data?.orderID);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment failed");
      }
      const result = await res.json();
      toast.success("Subscription activated! Redirecting...");
      await fetchSubscription(); // Refresh subscription
      router.push("/"); // Back to home
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment capture failed");
    }
  };

  const onApproveSubscription = async (data: any, planApiPath: string) => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error("Please sign in to complete subscription");
        router.push("/sign-in?redirect=/subscriptions");
        return;
      }
      console.log("[PayPal] Approved subscription:", data?.subscriptionID);
      const res = await fetch(`/api/subscribe/activate/${planApiPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionID: data.subscriptionID })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Failed to activate subscription");
      }
      toast.success("Subscription activated! Redirecting...");
      await fetchSubscription();
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscription activation failed");
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>);

  }

  const currentPlan = subscription?.plan || "free";
  const isExpired = subscription?.expiry && new Date(subscription.expiry) < new Date();

  const showPayPal = !!session?.user; // always show when logged-in (falls back to sandbox if no client ID)

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading-medium">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2">Upgrade to access more features and credits.</p>
          {subscription &&
          <Badge variant={currentPlan === "free" ? "secondary" : "default"} className="mt-4">
              Current Plan: {currentPlan.toUpperCase()} {isExpired && "(Expired)"}
              {subscription.expiry && ` (Expires: ${new Date(subscription.expiry).toLocaleDateString()})`}
            </Badge>
          }
          {!paypalClientId && session?.user &&
          <div className="mt-4 text-xs text-amber-600">
              Sandbox mode: using demo PayPal client. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID for live buttons.
            </div>
          }
        </div>

        {showPayPal ?
        <PayPalScriptProvider
          key={`${effectiveClientId}-${subscriptionsEnabled ? "sub" : "order"}`}
          options={{
            "client-id": effectiveClientId!,
            currency: "USD",
            components: "buttons",
            intent: subscriptionsEnabled ? "subscription" as const : "capture" as const,
            vault: subscriptionsEnabled ? true : undefined
          }}>

            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id && !isExpired;
              const planId = planIdMap[plan.id];
              return (
                <Card key={plan.id} className="relative">
                    {isCurrent &&
                  <div className="absolute top-4 right-4">
                        <Badge variant="secondary">Current Plan</Badge>
                      </div>
                  }
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{plan.price}</div>
                        <p className="text-muted-foreground">per month</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span>•</span> {plan.credits}
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span> {plan.id === "basic" ? "Basic model access" : "Advanced model access"}
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span> Monthly renewal
                        </li>
                      </ul>
                      {isCurrent ?
                    <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button> :
                    subscriptionsEnabled && planId ?
                    <PayPalButtons
                      createSubscription={(data, actions) => {
                        return actions.subscription!.create({ plan_id: planId });
                      }}
                      onApprove={(data) => onApproveSubscription(data, plan.apiPath)}
                      onError={(err) => {
                        console.error("[PayPal] Subscription error:", err);
                        toast.error("PayPal subscription error. See console for details.");
                      }}
                      style={{ layout: "horizontal" }} /> :


                    <PayPalButtons
                      createOrder={() => createOrder(plan.apiPath)}
                      onApprove={(data) => onApprove(data, plan.apiPath)}
                      onError={(err) => {
                        console.error("[PayPal] Buttons error:", err, { orderId });
                        toast.error("PayPal error. Please check console for details.");
                      }}
                      style={{ layout: "horizontal" }} />

                    }
                    </CardContent>
                  </Card>);

            })}
            </div>
          </PayPalScriptProvider> :

        <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id && !isExpired;
            return (
              <Card key={plan.id} className="relative">
                  {isCurrent &&
                <div className="absolute top-4 right-4">
                      <Badge variant="secondary">Current Plan</Badge>
                    </div>
                }
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{plan.price}</div>
                      <p className="text-muted-foreground">per month</p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span>•</span> {plan.credits}
                      </li>
                      <li className="flex items-center gap-2">
                        <span>•</span> {plan.id === "basic" ? "Basic model access" : "Advanced model access"}
                      </li>
                      <li className="flex items-center gap-2">
                        <span>•</span> Monthly renewal
                      </li>
                    </ul>
                    {isCurrent ?
                  <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button> :
                  !session?.user ?
                  <Button
                    className="w-full"
                    onClick={() => router.push("/sign-in?redirect=/subscriptions")}>

                        Sign in to subscribe
                      </Button> :

                  <Button className="w-full" variant="secondary" disabled>
                        Loading payments...
                      </Button>
                  }
                  </CardContent>
                </Card>);

          })}
          </div>
        }

        <div className="text-center text-sm text-muted-foreground">
          <p>Already subscribed?{" "}
            <Link href="/checkout" className="text-primary hover:underline">
              Manage credits
            </Link>{" "}
            or contact support.
          </p>
        </div>

        {/* Credits Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Credits & Usage Details</CardTitle>
            <CardDescription>Understand what you get, credit costs, and how to purchase more.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>What You Get</TableHead>
                    <TableHead>Credit Cost</TableHead>
                    <TableHead>Daily Limits</TableHead>
                    <TableHead>How to Buy Extra Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><Badge variant="secondary">Free</Badge></TableCell>
                    <TableCell>Limited access to basic features</TableCell>
                    <TableCell>1 credit per message</TableCell>
                    <TableCell className="!whitespace-pre-line">None, limited messages for free account</TableCell>
                    <TableCell>
                      <Link href="/checkout" className="text-primary hover:underline">
                        Buy credits via PayPal
                      </Link>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge>Basic</Badge></TableCell>
                    <TableCell className="!whitespace-pre-line">100 credits/month, including hesper 1.0v </TableCell>
                    <TableCell>1 credit per message</TableCell>
                    <TableCell className="!whitespace-pre-line">30 messages/day (resets at midnight)</TableCell>
                    <TableCell>
                      <Link href="/checkout" className="text-primary hover:underline">
                        Buy extra credits via PayPal
                      </Link>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge>Pro</Badge></TableCell>
                    <TableCell className="!whitespace-pre-line">200 credits/month, advanced features including Hesper pro, 50 messages/day</TableCell>
                    <TableCell>1 credit per message</TableCell>
                    <TableCell>50 messages/day (resets at midnight)</TableCell>
                    <TableCell>
                      <Link href="/checkout" className="text-primary hover:underline">
                        Buy extra credits via PayPal
                      </Link>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="text-sm mt-4 !text-rose-600">
              Credits are deducted per message sent. Unused monthly credits do not roll over. Extra credits can be purchased at any time through the checkout page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);

}