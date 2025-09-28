import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-heading-medium text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for your purchase. Your payment has been processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Button asChild className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}