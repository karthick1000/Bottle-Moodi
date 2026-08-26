import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { SHIPPING_DEFAULTS } from "@/lib/data";

export type { OrderStatus };

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

export async function getUserOrdersByAnyId(clerkUserIds: string[]) {
  return prisma.order.findMany({
    where: { clerkUserId: { in: clerkUserIds } },
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
  items: { productId: number; size: string; amount: number; unitPrice: number }[],
  addressId: number,
  shipping = SHIPPING_DEFAULTS.fee,
  discountCode?: string,
  discountAmount = 0,
  status?: OrderStatus,
  paymentId?: number,
) {
  return prisma.order.create({
    data: {
      clerkUserId,
      addressId,
      shipping,
      discountCode: discountCode ?? null,
      discountAmount,
      ...(status ? { status } : {}),
      ...(paymentId != null ? { paymentId } : {}),
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
