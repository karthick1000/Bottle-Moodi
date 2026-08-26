import { NextRequest } from "next/server";
import { updateTag, deleteTag, countProductsWithTag } from "@/lib/db/tags";
import { updateTagSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isInteger(n) ? n : null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminUserId(req);
    const { id } = await params;
    const numId = parseId(id);
    if (numId === null) return jsonErr("Invalid id", 400);
    const body = await parseBody(req, updateTagSchema);
    return jsonOk(await updateTag(numId, body));
  } catch (res) {
    if (res instanceof Response) return res;
    if (isUniqueViolation(res)) return jsonErr("That tag already exists", 409);
    return jsonErr("Failed to update tag", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminUserId(req);
    const { id } = await params;
    const numId = parseId(id);
    if (numId === null) return jsonErr("Invalid id", 400);
    // Reported back so the console can say how many posters just lost their chip.
    const untagged = await countProductsWithTag(numId);
    await deleteTag(numId);
    return jsonOk({ deleted: true, untagged });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to delete tag", 500);
  }
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}
