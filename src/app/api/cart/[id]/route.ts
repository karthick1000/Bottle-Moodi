import { NextRequest } from "next/server";
import { removeCartItem } from "@/lib/db/cart";
import { getAuthUserId, jsonOk, jsonErr } from "@/lib/apiHelpers";

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
