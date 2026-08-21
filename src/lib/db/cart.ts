import { prisma } from "@/lib/prisma";

export async function getUserCart(clerkUserId: string) {
  return prisma.cartItem.findMany({
    where: { clerkUserId },
    include: {
      product: { select: { slug: true, title: true, tamil: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addOrUpdateCartItem(
  clerkUserId: string,
  productId: number,
  size: string,
  amount: number
) {
  return prisma.cartItem.upsert({
    where: { clerkUserId_productId_size: { clerkUserId, productId, size } },
    create: { clerkUserId, productId, size, amount },
    update: { amount },
  });
}

export async function removeCartItem(
  id: number,
  clerkUserId: string
): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { id, clerkUserId } });
}

export async function clearUserCart(clerkUserId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { clerkUserId } });
}
