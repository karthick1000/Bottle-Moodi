import { NextRequest } from "next/server";
import { getAdminUserId, jsonOk, jsonErr } from "@/lib/apiHelpers";
import { deleteProductImage } from "@/lib/db/productImages";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    await getAdminUserId(req);
    const { imageId } = await params;
    const id = parseInt(imageId, 10);
    if (isNaN(id)) return jsonErr("Invalid imageId", 400);
    await deleteProductImage(id);
    return jsonOk({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to delete image", 500);
  }
}
