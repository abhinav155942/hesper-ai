"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalButtonProps {
  amount?: string;
  currency?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (err: any) => void;
}

export function PayPalButton({ amount = "10.00", currency = "USD", onSuccess, onError }: PayPalButtonProps) {
  const [orderId, setOrderId] = useState<string | null>(null);

  const createOrder = async () => {
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency }),
      });
      const { orderID, error } = await response.json();
      if (!response.ok || !orderID) {
        throw new Error(error || "Failed to create PayPal order");
      }
      setOrderId(orderID);
      return orderID;
    } catch (err) {
      onError?.(err);
      return null;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch(`/api/paypal/orders/${data.orderID}/capture`, {
        method: "PUT",
      });
      const { status, error } = await response.json();
      if (!response.ok || status !== "COMPLETED") {
        throw new Error(error || "Payment not completed");
      }
      onSuccess?.(data.orderID);
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string,
        currency,
        components: "buttons",
        intent: "capture",
      }}
    >
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}