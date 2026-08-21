import { NextRequest } from "next/server";
import { updateDiscountCode, deleteDiscountCode } from "@/lib/db/discounts";
import { updateDiscountCodeSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminUserId(req);
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return jsonErr("Invalid id", 400);
    const body = await parseBody(req, updateDiscountCodeSchema);
    const code = await updateDiscountCode(numId, body);
    return jsonOk(code);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to update discount code", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminUserId(req);
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return jsonErr("Invalid id", 400);
    await deleteDiscountCode(numId);
    return jsonOk({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to delete discount code", 500);
  }
}
