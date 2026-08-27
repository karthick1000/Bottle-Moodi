import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { clearUserCart } from "@/lib/db/cart";
import { incrementUsedCount } from "@/lib/db/discounts";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { deliveryAddressSchema } from "@/lib/validators";
import { quoteOrder, quoteToOrderItems, UnavailableProductError } from "@/lib/db/quote";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const verifyPaymentSchema = z.object({
  razorpayOrderId:   z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  amountPaise:       z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size:      z.string().min(1),
        qty:       z.number().int().positive().default(1),
        // Accepted but ignored — the cart is repriced from the DB below.
        amount:    z.number().int().positive().optional(),
      })
    )
    .min(1),
  address:        deliveryAddressSchema,
  discountCode:   z.string().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  if (!KEY_SECRET) {
    console.error("[razorpay verify] missing RAZORPAY_KEY_SECRET");
    return jsonErr("Payment gateway not configured", 503);
  }

  try {
    const userId = await getAuthUserId(req);
    const body   = await parseBody(req, verifyPaymentSchema);

    // ── 1. Price the cart server-side ─────────────────────────────────────
    let quote;
    try {
      quote = await quoteOrder(body.items, body.discountCode);
    } catch (e) {
      if (e instanceof UnavailableProductError) return jsonErr(e.message, 400);
      throw e;
    }

    // ── 2. HMAC-SHA256 signature verification ─────────────────────────────
    // This is the only proof of a genuine Razorpay payment.
    // The signature is: HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, KEY_SECRET)
    const expectedSig = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSig !== body.razorpaySignature) {
      console.error(
        `[razorpay verify] SIGNATURE MISMATCH userId=${userId} orderId=${body.razorpayOrderId} paymentId=${body.razorpayPaymentId}`
      );
      return jsonErr(
        "Payment verification failed. If money was debited, please contact support with your payment ID.",
        400
      );
    }

    // ── 3. The paid amount must be the amount we quote ────────────────────
    // Prices or the delivery rule can change between create-order and here.
    // Recording an order that doesn't match what was charged is worse than
    // refusing it, so bail and let support reconcile against the payment id.
    const expectedPaise = quote.total * 100;
    if (body.amountPaise !== expectedPaise) {
      console.error(
        `[razorpay verify] AMOUNT MISMATCH userId=${userId} paymentId=${body.razorpayPaymentId} ` +
        `paid=${body.amountPaise} expected=${expectedPaise}`
      );
      return jsonErr(
        "Prices changed while you were paying, so we have not placed this order. " +
        "Nothing further will be charged — contact support with your payment ID and we will sort it out.",
        409
      );
    }

    // ── 4. Atomically create Payment + Address + Order ─────────────────────
    // If any step fails, all three roll back — no orphaned Payment record.
    const order = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          razorpayOrderId:   body.razorpayOrderId,
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
          amountPaise:       body.amountPaise,
          currency:          "INR",
        },
      });

      const address = await tx.address.create({
        data: {
          clerkUserId: userId,
          name:        body.address.name,
          phone:       body.address.phone,
          line1:       body.address.line1,
          city:        body.address.city,
          pincode:     body.address.pincode,
        },
      });

      return tx.order.create({
        data: {
          clerkUserId:    userId,
          status:         "PAID",
          shipping:       quote.shipping,
          discountCode:   body.discountCode ?? null,
          discountAmount: quote.discountAmount,
          addressId:      address.id,
          paymentId:      payment.id,
          items: { create: quoteToOrderItems(quote) },
        },
        include: {
          items: {
            include: { product: { select: { title: true, tamil: true } } },
          },
          address:  true,
          payment:  true,
        },
      });
    });

    // ── 5. Post-transaction side effects (non-fatal) ───────────────────────
    await clearUserCart(userId);

    if (quote.discountId != null) {
      await incrementUsedCount(quote.discountId);
    }

    console.log(
      `[razorpay verify] SUCCESS userId=${userId} orderId=${order.id} paymentId=${body.razorpayPaymentId} amountPaise=${body.amountPaise}`
    );

    sendOrderConfirmationEmail(order, userId).catch((err) => {
      console.error("[email] order confirmation failed:", err?.message ?? err);
    });

    return jsonOk(order);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[razorpay verify] unexpected error:", res);
    return jsonErr(
      "Order could not be created after payment. Please contact support with your payment ID.",
      500
    );
  }
}
