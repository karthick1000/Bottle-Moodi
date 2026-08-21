import { NextRequest } from "next/server";
import { getUserOrders, createOrder } from "@/lib/db/orders";
import { createAddress } from "@/lib/db/addresses";
import { clearUserCart } from "@/lib/db/cart";
import { createOrderSchema } from "@/lib/validators";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";
import { validateDiscountCode, incrementUsedCount } from "@/lib/db/discounts";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const orders = await getUserOrders(userId);
    return jsonOk(orders);
  } catch (res) {
    if (res instanceof Response) return res;
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
    sendOrderConfirmationEmail(order, userId).catch(() => {});

    return jsonOk(order);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to create order", 500);
  }
}
