import { NextRequest } from "next/server";
import { validateDiscountCode } from "@/lib/db/discounts";
import { validateDiscountSchema } from "@/lib/validators";
import { jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, validateDiscountSchema);
    const result = await validateDiscountCode(body.code, body.orderTotal);
    return jsonOk({
      valid: result.valid,
      discountAmount: result.discountAmount,
      ...(result.message ? { message: result.message } : {}),
      ...(result.type ? { type: result.type } : {}),
      ...(result.value !== undefined ? { value: result.value } : {}),
    });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to validate discount code", 500);
  }
}
