import { NextRequest } from "next/server";
import { getAllTagsUncached, createTag } from "@/lib/db/tags";
import { createTagSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

// Admin data must never be served from a cached render.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await getAdminUserId(req);
    return jsonOk(await getAllTagsUncached());
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to fetch tags", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const body = await parseBody(req, createTagSchema);
    return jsonOk(await createTag(body.label));
  } catch (res) {
    if (res instanceof Response) return res;
    if (isUniqueViolation(res)) return jsonErr("That tag already exists", 409);
    return jsonErr("Failed to create tag", 500);
  }
}

/** Prisma's unique-constraint code — a duplicate label is the admin's mistake, not a 500. */
function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}
