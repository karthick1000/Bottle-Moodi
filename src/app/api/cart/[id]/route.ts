import { NextRequest } from "next/server";
import { z } from "zod";
import { removeCartItem, updateCartItemQty } from "@/lib/db/cart";
import { getAuthUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

const patchSchema = z.object({
  qty: z.number().int().positive(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) return jsonErr("Invalid id", 400);
    const body = await parseBody(req, patchSchema);
    await updateCartItemQty(itemId, userId, body.qty);
    return jsonOk({ updated: true });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to update cart item", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) return jsonErr("Invalid id", 400);
    await removeCartItem(itemId, userId);
    return jsonOk({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to remove cart item", 500);
  }
}
