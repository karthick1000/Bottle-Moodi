import { NextRequest } from "next/server";
import { getUserOrders, createOrder } from "@/lib/db/orders";
import { clearUserCart } from "@/lib/db/cart";
import { createOrderSchema } from "@/lib/validators";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

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
    const body = await parseBody(req, createOrderSchema);
    const order = await createOrder(userId, body.items);
    await clearUserCart(userId);
    return jsonOk(order);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to create order", 500);
  }
}
