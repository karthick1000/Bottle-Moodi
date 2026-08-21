import { getProductBySlug } from "@/lib/db/products";
import { jsonOk, jsonErr } from "@/lib/apiHelpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return jsonErr("Product not found", 404);
    return jsonOk(product);
  } catch {
    return jsonErr("Failed to fetch product", 500);
  }
}
