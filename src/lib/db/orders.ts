import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function getUserOrders(clerkUserId: string) {
  return prisma.order.findMany({
    where: { clerkUserId },
    include: {
      items: {
        include: { product: { select: { title: true, tamil: true } } },
      },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: {
      items: {
        include: { product: { select: { title: true, tamil: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(
  clerkUserId: string,
  items: { productId: number; size: string; amount: number }[],
  shipping = 79,
  discountCode?: string,
  discountAmount = 0,
  addressId?: number
) {
  return prisma.order.create({
    data: {
      clerkUserId,
      shipping,
      discountCode: discountCode ?? null,
      discountAmount,
      ...(addressId != null ? { addressId } : {}),
      items: { create: items },
    },
    include: {
      items: {
        include: { product: { select: { title: true, tamil: true } } },
      },
    },
  });
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: {
        include: { product: { select: { title: true, tamil: true } } },
      },
    },
  });
}
