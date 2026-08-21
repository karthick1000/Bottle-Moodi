import { prisma } from "@/lib/prisma";

export async function addProductImage(productId: number, url: string) {
  const count = await prisma.productImage.count({ where: { productId } });
  return prisma.productImage.create({
    data: { productId, url, position: count },
  });
}

export async function deleteProductImage(id: number) {
  return prisma.productImage.delete({ where: { id } });
}

export async function getProductImages(productId: number) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });
}
