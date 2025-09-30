import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Auth
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    // Body
    const body = await request.json().catch(() => ({}));
    const { subscriptionID } = body as { subscriptionID?: string };

    if (!subscriptionID) {
      return NextResponse.json(
        { error: "subscriptionID is required", code: "MISSING_SUBSCRIPTION_ID" },
        { status: 400 }
      );
    }

    // Fetch user
    const [userRow] = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (!userRow) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Calculate updates for PRO plan
    const currentCredits = userRow.credits || 0;
    const newCredits = currentCredits + 200; // Pro adds 200 credits per cycle
    const subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [updated] = await db
      .update(user)
      .set({
        subscriptionPlan: "pro",
        subscriptionExpiry,
        credits: newCredits,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update subscription", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Subscription activated (pro)",
        subscription: {
          plan: "pro",
          expiry: subscriptionExpiry.toISOString(),
          credits: newCredits,
        },
        subscriptionID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[activate/pro] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}