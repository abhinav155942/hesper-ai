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
    description: "Unlimited credits, advanced reasoning & research",
    credits: "Unlimited credits",
    apiPath: "pro"
  }
] as const;

export default function SubscriptionsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading) {
      fetchSubscription();
    }
  }, [sessionLoading]);

  const fetchSubscription = async () => {
    if (!session?.user) { setLoading(false); return; }
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/user/subscription", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
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
        return null;
      }
      const res = await fetch(`/api/subscribe/${planApiPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }
      const { orderID } = await res.json();
      setOrderId(orderID);
      return orderID;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order creation failed");
      return null;
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

  if (sessionLoading || loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const isExpired = subscription?.expiry && new Date(subscription.expiry) < new Date();

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading-medium">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2">Upgrade to access more features and credits.</p>
          {subscription && (
            <Badge variant={currentPlan === "free" ? "secondary" : "default"} className="mt-4">
              Current Plan: {currentPlan.toUpperCase()} {isExpired && "(Expired)"}
              {subscription.expiry && ` (Expires: ${new Date(subscription.expiry).toLocaleDateString()})`}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id && !isExpired;
            return (
              <Card key={plan.id} className="relative">
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
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
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <PayPalScriptProvider
                      options={{
                        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string,
                        currency: "USD",
                        components: "buttons",
                        intent: "capture",
                      }}
                    >
                      <PayPalButtons
                        createOrder={() => createOrder(plan.apiPath)}
                        onApprove={(data) => onApprove(data, plan.apiPath)}
                        style={{ layout: "horizontal" }}
                      />
                    </PayPalScriptProvider>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Already subscribed?{" "}
            <Link href="/checkout" className="text-primary hover:underline">
              Manage credits
            </Link>{" "}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}