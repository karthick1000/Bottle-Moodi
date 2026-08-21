import { NextRequest } from "next/server";
import { getAllOrders } from "@/lib/db/orders";
import { getAdminUserId, jsonOk, jsonErr } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const orders = await getAllOrders();
    return jsonOk(orders);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to fetch orders", 500);
  }
}
