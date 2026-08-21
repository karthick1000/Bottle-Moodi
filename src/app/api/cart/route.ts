import { NextRequest } from "next/server";
import { getUserCart, addOrUpdateCartItem } from "@/lib/db/cart";
import { addCartItemSchema } from "@/lib/validators";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const cart = await getUserCart(userId);
    return jsonOk(cart);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to fetch cart", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    const body = await parseBody(req, addCartItemSchema);
    const item = await addOrUpdateCartItem(
      userId,
      body.productId,
      body.size,
      body.amount
    );
    return jsonOk(item);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to add cart item", 500);
  }
}
