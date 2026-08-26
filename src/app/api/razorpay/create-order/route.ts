import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";
import { quoteOrder, UnavailableProductError } from "@/lib/db/quote";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

/**
 * The client says what is in the cart, never what it costs. Taking an `amount`
 * from the browser let a stale — or edited — page open a payment for any
 * figure it liked.
 */
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size:      z.string().min(1),
      })
    )
    .min(1),
  discountCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!KEY_ID || !KEY_SECRET) {
    console.error("[razorpay create-order] missing credentials");
    return jsonErr("Payment gateway not configured", 503);
  }

  try {
    await getAuthUserId(req);
    const body = await parseBody(req, createOrderSchema);

    let quote;
    try {
      quote = await quoteOrder(body.items, body.discountCode);
    } catch (e) {
      if (e instanceof UnavailableProductError) return jsonErr(e.message, 400);
      throw e;
    }

    const amountPaise = quote.total * 100;
    if (amountPaise < 100) {
      return jsonErr("Order total is below the minimum payable amount", 400);
    }

    const receipt = `bm_${Date.now()}`;
    const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.json().catch(() => ({}));
      console.error("[razorpay create-order] Razorpay API error:", err);
      return jsonErr("Failed to create payment order. Please try again.", 502);
    }

    const order = await rzpRes.json();

    // The quote goes back so the page can reconcile against what it displayed
    // and refuse to open a modal for a number the customer never saw.
    return jsonOk({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      quote: {
        lines:          quote.lines,
        subtotal:       quote.subtotal,
        shipping:       quote.shipping,
        discountAmount: quote.discountAmount,
        total:          quote.total,
      },
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[razorpay create-order] unexpected error:", res);
    return jsonErr("Internal server error", 500);
  }
}
