"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PayPalButtonsComponent from "./PayPalButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CheckoutForm() {
  const [amount, setAmount] = useState(10.00);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Payment successful!");
    router.push("/success");
  };

  const handleError = (error: any) => {
    toast.error("Payment failed: " + error.message);
    setIsLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-heading-medium">Enter Amount</CardTitle>
        <CardDescription>
          Choose the amount you want to pay in USD.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="amount" className="text-sm font-medium text-foreground/80 mb-2 block">
            Amount ($)
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="text-lg"
            placeholder="10.00"
          />
        </div>
        <PayPalButtonsComponent
          amount={amount}
          currency="USD"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </CardContent>
    </Card>
  );
}