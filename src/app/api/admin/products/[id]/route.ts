import { NextRequest } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/db/products";
import { updateProductSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminUserId(req);
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return jsonErr("Invalid id", 400);
    const body = await parseBody(req, updateProductSchema);
    const product = await updateProduct(numId, body);
    return jsonOk(product);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to update product", 500);
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
    await deleteProduct(numId);
    return jsonOk({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to delete product", 500);
  }
}
