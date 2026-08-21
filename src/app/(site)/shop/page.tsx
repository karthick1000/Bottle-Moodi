import { getAllProducts } from "@/lib/db/products";
import { ShopClient } from "./ShopClient";

export default async function ShopPage() {
  const products = await getAllProducts(true);
  return <ShopClient products={products} />;
}
