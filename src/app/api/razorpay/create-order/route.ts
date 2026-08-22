import { NextRequest } from "next/server";
import { getAuthUserId, jsonOk, jsonErr } from "@/lib/apiHelpers";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: NextRequest) {
  if (!KEY_ID || !KEY_SECRET) {
    console.error("[razorpay create-order] missing credentials");
    return jsonErr("Payment gateway not configured", 503);
  }

  try {
    await getAuthUserId(req);

    const body = await req.json().catch(() => ({}));
    const amountPaise = Math.round(Number(body.amount));

    if (!Number.isInteger(amountPaise) || amountPaise < 100) {
      return jsonErr("Invalid payment amount", 400);
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
    return jsonOk({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[razorpay create-order] unexpected error:", res);
    return jsonErr("Internal server error", 500);
  }
}
