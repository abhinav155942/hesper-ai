"use client";

import * as React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';

interface PayPalButtonsProps {
  amount: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function PayPalButtonsComponent({ amount, currency = 'USD', onSuccess, onError }: PayPalButtonsProps) {
  const router = useRouter();

  const createOrder = async () => {
    try {
      const response = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      return data.orderID;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch('/api/capture-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      if (!response.ok) {
        throw new Error('Failed to capture order');
      }

      const result = await response.json();
      if (result.success) {
        onSuccess?.();
        router.push('/success'); // Or handle success as needed
      }
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <PayPalScriptProvider 
      options={{
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: currency,
        intent: 'capture',
      }}
    >
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        style={{ layout: 'horizontal' }}
      />
    </PayPalScriptProvider>
  );
}