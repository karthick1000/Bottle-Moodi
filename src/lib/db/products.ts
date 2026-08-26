import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SIZE_UPCHARGE } from "@/lib/data";

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  title: true,
  tamil: true,
  tag: true,
  base: true,
  priceA3: true,
  priceA2: true,
  sub: true,
  active: true,
  images: { orderBy: { position: "asc" as const } },
} as const;

async function _getAllProducts(activeOnly = true) {
  return prisma.product.findMany({
    where: activeOnly ? { active: true } : undefined,
    select: PRODUCT_SELECT,
    orderBy: { id: "asc" },
  });
}

/**
 * Cached product list for public pages (shop, home, product detail).
 * Invalidated by revalidateTag("products") on every product/image mutation.
 * The activeOnly flag is part of the cache key so the admin (false) and
 * storefront (true) views never share an entry.
 */
export const getAllProducts = unstable_cache(
  _getAllProducts,
  ["products-list"],
  { tags: ["products"] }
);

/**
 * Uncached product list — always hits the DB.
 * The admin console must never read from cache: it is the surface where
 * products are created and edited, so a stale entry there looks like data
 * loss. Public pages keep using the cached getAllProducts above.
 */
export async function getAllProductsUncached(activeOnly = false) {
  return _getAllProducts(activeOnly);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    select: PRODUCT_SELECT,
  });
}

export async function createProduct(data: {
  slug: string;
  title: string;
  tamil: string;
  tag: string;
  base: number;
  priceA3?: number;
  priceA2?: number;
  sub: string;
  active?: boolean;
}) {
  // A3/A2 are per-product now, but a caller that only knows the A4 price
  // (the admin's "New product" draft) still gets sensible starting values.
  const product = await prisma.product.create({
    data: {
      ...data,
      priceA3: data.priceA3 ?? data.base + SIZE_UPCHARGE.A3,
      priceA2: data.priceA2 ?? data.base + SIZE_UPCHARGE.A2,
    },
    select: PRODUCT_SELECT,
  });
  revalidateTag("products");
  return product;
}

export async function updateProduct(
  id: number,
  data: Partial<{
    slug: string;
    title: string;
    tamil: string;
    tag: string;
    base: number;
    priceA3: number;
    priceA2: number;
    sub: string;
    active: boolean;
  }>
) {
  const product = await prisma.product.update({ where: { id }, data, select: PRODUCT_SELECT });
  revalidateTag("products");
  return product;
}

export async function deleteProduct(id: number): Promise<void> {
  await prisma.product.delete({ where: { id } });
  revalidateTag("products");
}
