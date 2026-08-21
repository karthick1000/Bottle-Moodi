import { NextRequest } from "next/server";
import { updateOrderStatus } from "@/lib/db/orders";
import { updateOrderStatusSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminUserId(req);
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return jsonErr("Invalid id", 400);
    const body = await parseBody(req, updateOrderStatusSchema);
    const order = await updateOrderStatus(numId, body.status as OrderStatus);
    return jsonOk(order);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to update order", 500);
  }
}
