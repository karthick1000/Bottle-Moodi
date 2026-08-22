import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function addProductImage(productId: number, url: string) {
  const count = await prisma.productImage.count({ where: { productId } });
  const image = await prisma.productImage.create({
    data: { productId, url, position: count },
  });
  revalidateTag("products");
  return image;
}

export async function deleteProductImage(id: number) {
  const image = await prisma.productImage.delete({ where: { id } });
  revalidateTag("products");
  return image;
}

export async function getProductImages(productId: number) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });
}
