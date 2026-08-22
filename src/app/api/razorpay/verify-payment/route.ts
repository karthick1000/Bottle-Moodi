import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";
import { createAddress } from "@/lib/db/addresses";
import { createOrder } from "@/lib/db/orders";
import { clearUserCart } from "@/lib/db/cart";
import { validateDiscountCode, incrementUsedCount } from "@/lib/db/discounts";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { deliveryAddressSchema } from "@/lib/validators";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size: z.string().min(1),
        amount: z.number().int().positive(),
      })
    )
    .min(1),
  address: deliveryAddressSchema,
  discountCode: z.string().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  if (!KEY_SECRET) {
    console.error("[razorpay verify] missing KEY_SECRET");
    return jsonErr("Payment gateway not configured", 503);
  }

  try {
    const userId = await getAuthUserId(req);
    const body = await parseBody(req, verifyPaymentSchema);

    // HMAC-SHA256 signature verification — the only proof of a genuine Razorpay payment
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

    // Re-validate discount server-side to prevent tampering
    let resolvedDiscountAmount = body.discountAmount ?? 0;
    let discountId: number | undefined;
    if (body.discountCode) {
      const subtotal = body.items.reduce((s, i) => s + i.amount, 0);
      const validation = await validateDiscountCode(body.discountCode, subtotal);
      if (validation.valid) {
        resolvedDiscountAmount = validation.discountAmount;
        discountId = validation.discountId;
      } else {
        resolvedDiscountAmount = 0;
      }
    }

    const address = await createAddress({
      clerkUserId: userId,
      name: body.address.name,
      phone: body.address.phone,
      line1: body.address.line1,
      city: body.address.city,
      pincode: body.address.pincode,
    });

    // Create the order with PAID status — payment is confirmed above
    const order = await createOrder(
      userId,
      body.items,
      undefined,
      body.discountCode,
      resolvedDiscountAmount,
      address.id,
      "PAID"
    );

    await clearUserCart(userId);

    if (body.discountCode && discountId != null) {
      await incrementUsedCount(discountId);
    }

    console.log(
      `[razorpay verify] SUCCESS userId=${userId} orderId=${order.id} razorpayPaymentId=${body.razorpayPaymentId} razorpayOrderId=${body.razorpayOrderId}`
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
