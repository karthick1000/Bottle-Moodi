import { prisma } from "@/lib/prisma";
import { priceFor, type Size } from "@/lib/data";

/**
 * A signed-in user's cart, repriced at read time.
 *
 * CartItem.amount is whatever the price was when the row was written, which
 * goes stale the moment the admin edits a poster. Returning the stored figure
 * showed customers a price checkout would not honour, so the current one is
 * substituted on the way out.
 */
export async function getUserCart(clerkUserId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { clerkUserId },
    include: {
      product: {
        select: {
          slug: true, title: true, tamil: true,
          base: true, priceA3: true, priceA2: true,
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(({ product, ...row }) => ({
    ...row,
    amount: priceFor(product, row.size as Size),
    qty: row.qty,
    product: {
      slug: product.slug,
      title: product.title,
      tamil: product.tamil,
      image: product.images[0]?.url,
    },
  }));
}

export async function addOrUpdateCartItem(
  clerkUserId: string,
  productId: number,
  size: string,
  amount: number,
  qty: number = 1
) {
  return prisma.cartItem.upsert({
    where: { clerkUserId_productId_size: { clerkUserId, productId, size } },
    create: { clerkUserId, productId, size, amount, qty },
    update: { amount, qty },
  });
}

export async function updateCartItemQty(
  id: number,
  clerkUserId: string,
  qty: number
) {
  return prisma.cartItem.updateMany({
    where: { id, clerkUserId },
    data: { qty },
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
