import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-medium">Checkout</h1>
      <p className="text-muted-foreground mt-2">
        Choose your payment method to continue.
      </p>
      {/* Checkout form with PayPal (Live) */}
      <div className="mt-6">
        <CheckoutForm />
      </div>
    </main>
  );
}