import { getAllProducts } from "@/lib/db/products";
import { getAllTags } from "@/lib/db/tags";
import { ShopClient } from "./ShopClient";

export default async function ShopPage() {
  // Both reads are cached and independent — fire them together.
  const [products, tags] = await Promise.all([getAllProducts(true), getAllTags()]);
  return <ShopClient products={products} tags={tags} />;
}
