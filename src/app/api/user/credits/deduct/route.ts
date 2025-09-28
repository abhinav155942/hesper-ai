import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// POST /api/user/credits/deduct
// Body: { amount: number }
// Deducts credits from the authenticated user's balance if sufficient
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required. Please login to continue.", code: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const amount = (body as any)?.amount;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Amount is required", code: "MISSING_AMOUNT" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Amount must be a number", code: "INVALID_AMOUNT_TYPE" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "Amount must be a whole number", code: "INVALID_AMOUNT_FORMAT" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0", code: "INVALID_AMOUNT_VALUE" },
        { status: 400 }
      );
    }

    // Ensure user exists and has enough credits, then deduct atomically-ish
    // Using a transaction and conditional update to prevent negative balances
    const result = await db.transaction(async (tx) => {
      // Check current credits
      const rows = await tx
        .select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, currentUser.id))
        .limit(1);

      if (rows.length === 0) {
        return { ok: false as const, status: 404, payload: { error: "User not found", code: "USER_NOT_FOUND" } };
      }

      const currentCredits = rows[0].credits ?? 0;
      if (currentCredits < amount) {
        return {
          ok: false as const,
          status: 402, // Payment Required / insufficient credits
          payload: {
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            credits: currentCredits,
            required: amount,
          },
        };
      }

      // Conditional update: only deduct if credits >= amount at update time
      const updated = await tx
        .update(user)
        .set({ credits: currentCredits - amount, updatedAt: new Date() })
        .where(and(eq(user.id, currentUser.id), gte(user.credits, amount)))
        .returning({ id: user.id, credits: user.credits });

      if (updated.length === 0) {
        // Another concurrent deduction could have happened; report insufficient
        return {
          ok: false as const,
          status: 409,
          payload: { error: "Conflict during deduction. Please retry.", code: "DEDUCTION_CONFLICT" },
        };
      }

      return { ok: true as const, status: 200, payload: { credits: updated[0].credits, deducted: amount } };
    });

    if (!result.ok) {
      return NextResponse.json(result.payload as any, { status: result.status });
    }

    return NextResponse.json(result.payload, { status: 200 });
  } catch (error) {
    console.error("POST /api/user/credits/deduct error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}