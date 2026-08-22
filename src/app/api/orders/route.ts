import { NextRequest } from "next/server";
import { getUserOrders, getUserOrdersByAnyId, createOrder } from "@/lib/db/orders";
import { createAddress } from "@/lib/db/addresses";
import { clearUserCart } from "@/lib/db/cart";
import { createOrderSchema } from "@/lib/validators";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";
import { validateDiscountCode, incrementUsedCount } from "@/lib/db/discounts";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    let orders = await getUserOrders(userId);

    console.log(`[orders GET] userId=${userId} found=${orders.length}`);

    if (orders.length === 0) {
      // Raw SQL diagnostic: check if the row actually exists in the DB under this userId
      try {
        const raw = await prisma.$queryRaw<Array<{ id: number; clerkUserId: string }>>`
          SELECT id, "clerkUserId" FROM "Order" WHERE "clerkUserId" = ${userId} LIMIT 5
        `;
        console.log(`[orders GET] raw SQL found=${raw.length} rows:`, JSON.stringify(raw));

        if (raw.length > 0) {
          // Row IS in DB but findMany returned nothing — likely a Prisma include join issue
          console.error("[orders GET] MISMATCH: raw SQL found rows but findMany returned 0 — retrying with minimal include");
          orders = await getUserOrders(userId);
        } else {
          // Row is NOT in DB for this userId — log existing clerkUserIds for comparison
          const allRows = await prisma.$queryRaw<Array<{ clerkUserId: string }>>`
            SELECT DISTINCT "clerkUserId" FROM "Order" LIMIT 20
          `;
          console.log(`[orders GET] clerkUserIds in DB: ${JSON.stringify(allRows.map((r) => r.clerkUserId))}`);
        }
      } catch (diagErr) {
        console.error("[orders GET] raw SQL diagnostic failed:", diagErr);
      }
    }

    // Fallback: if no orders found under current userId, look up by email.
    // This handles the case where a user has multiple Clerk accounts (e.g. OAuth
    // vs email/password) with the same email address — both point to the same
    // real person so we surface all their orders.
    if (orders.length === 0) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress;
        if (email) {
          const { data: matches } = await client.users.getUserList({ emailAddress: [email] });
          const allIds = matches.map((u) => u.id);
          console.log(`[orders GET] email fallback: email=${email} clerks=${JSON.stringify(allIds)}`);
          // Include current userId in the lookup in case Clerk returns fewer accounts than expected
          const lookupIds = Array.from(new Set([...allIds, userId]));
          orders = await getUserOrdersByAnyId(lookupIds);
          console.log(`[orders GET] email fallback found=${orders.length}`);
        }
      } catch (e) {
        // Non-fatal — return what we have
        console.error("[orders GET] email fallback failed:", e);
      }
    }

    return jsonOk(orders);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[orders GET] unexpected error:", res);
    return jsonErr("Failed to fetch orders", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const body   = await parseBody(req, createOrderSchema);

    // Validate discount if provided
    let resolvedDiscountAmount = body.discountAmount ?? 0;
    let discountId: number | undefined;
    if (body.discountCode) {
      const subtotal   = body.items.reduce((s, i) => s + i.amount, 0);
      const validation = await validateDiscountCode(body.discountCode, subtotal);
      if (validation.valid) {
        resolvedDiscountAmount = validation.discountAmount;
        discountId = validation.discountId;
      }
    }

    const address = await createAddress({
      clerkUserId: userId,
      name:    body.address.name,
      phone:   body.address.phone,
      line1:   body.address.line1,
      city:    body.address.city,
      pincode: body.address.pincode,
    });

    const order = await createOrder(userId, body.items, undefined, body.discountCode, resolvedDiscountAmount, address.id);
    await clearUserCart(userId);

    if (body.discountCode && discountId != null) {
      await incrementUsedCount(discountId);
    }

    // Send confirmation email (non-blocking — don't fail the order if email fails)
    sendOrderConfirmationEmail(order, userId).catch((err) => {
      console.error("[email] order confirmation failed:", err?.message ?? err);
    });

    return jsonOk(order);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to create order", 500);
  }
}
