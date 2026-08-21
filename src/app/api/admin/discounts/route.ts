import { NextRequest } from "next/server";
import { getAllDiscountCodes, createDiscountCode } from "@/lib/db/discounts";
import { createDiscountCodeSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const codes = await getAllDiscountCodes();
    return jsonOk(codes);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to fetch discount codes", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const body = await parseBody(req, createDiscountCodeSchema);
    const code = await createDiscountCode(body);
    return jsonOk(code);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to create discount code", 500);
  }
}
