import { NextRequest } from "next/server";
import { getAllProducts, createProduct } from "@/lib/db/products";
import { createProductSchema } from "@/lib/validators";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const products = await getAllProducts(false);
    return jsonOk(products);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to fetch products", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const body = await parseBody(req, createProductSchema);
    const product = await createProduct(body);
    return jsonOk(product);
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to create product", 500);
  }
}
