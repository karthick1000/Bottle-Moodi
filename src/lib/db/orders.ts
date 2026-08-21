import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function getUserOrders(clerkUserId: string) {
  return prisma.order.findMany({
    where: { clerkUserId },
    include: {
      items: {
        include: { product: { select: { title: true, tamil: true } } },
      },
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
  shipping = 79
) {
  return prisma.order.create({
    data: {
      clerkUserId,
      shipping,
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
