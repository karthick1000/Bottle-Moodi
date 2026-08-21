import { getAllProducts } from "@/lib/db/products";
import { jsonOk, jsonErr } from "@/lib/apiHelpers";

export async function GET() {
  try {
    const products = await getAllProducts(true);
    return jsonOk(products);
  } catch {
    return jsonErr("Failed to fetch products", 500);
  }
}
