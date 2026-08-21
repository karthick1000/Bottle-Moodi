import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  title: true,
  tamil: true,
  tag: true,
  base: true,
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

export const getAllProducts = unstable_cache(
  _getAllProducts,
  ["products-list"],
  { tags: ["products"] }
);

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
  sub: string;
  active?: boolean;
}) {
  return prisma.product.create({ data, select: PRODUCT_SELECT });
}

export async function updateProduct(
  id: number,
  data: Partial<{
    slug: string;
    title: string;
    tamil: string;
    tag: string;
    base: number;
    sub: string;
    active: boolean;
  }>
) {
  return prisma.product.update({ where: { id }, data, select: PRODUCT_SELECT });
}

export async function deleteProduct(id: number): Promise<void> {
  await prisma.product.delete({ where: { id } });
}
