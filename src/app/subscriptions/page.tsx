"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function SubscriptionsPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Basic access to get started",
      features: [
        "Unlimited basic messages",
        "No lead generation",
        "No priority support",
        "X Hesper messages",
        "No export options"
      ],
      popular: false,
      cta: "Current Plan"
    },
    {
      name: "Pro",
      price: "$29/month",
      description: "For serious users needing more features",
      features: [
        "3 Pro AI messages/month",
        "Lead generation (10 quality leads)",
        "Priority email support",
        "3 Hesper 1.0v messages/month",
        "CSV export & email verification"
      ],
      popular: true,
      cta: "Upgrade to Pro"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored for businesses",
      features: [
        "Unlimited Pro AI messages",
        "Advanced lead generation",
        "Dedicated support",
        "Unlimited Hesper messages",
        "Custom integrations"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium text-foreground mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select a subscription that fits your needs. Start with free and upgrade as you grow.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary' : 'border-border'}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-4xl font-bold text-primary">{plan.price}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Check className={`h-4 w-4 ${plan.popular ? 'text-primary' : 'text-green-500'}`} />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.popular ? "default" : "outline"} disabled={plan.cta === "Current Plan"}>
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}