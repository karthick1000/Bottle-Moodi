import { prisma } from "@/lib/prisma";
import { DiscountType } from "@prisma/client";

export interface ValidateResult {
  valid: boolean;
  discountAmount: number;
  message?: string;
  discountId?: number;
  type?: "PERCENT" | "FLAT";
  value?: number;
}

export async function validateDiscountCode(
  code: string,
  orderTotal: number
): Promise<ValidateResult> {
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount) {
    return { valid: false, discountAmount: 0, message: "Invalid discount code" };
  }

  if (!discount.active) {
    return { valid: false, discountAmount: 0, message: "This code is no longer active" };
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return { valid: false, discountAmount: 0, message: "This code has expired" };
  }

  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    return { valid: false, discountAmount: 0, message: "This code has reached its usage limit" };
  }

  if (discount.minOrder != null && orderTotal < discount.minOrder) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of ₹${discount.minOrder} required for this code`,
    };
  }

  let discountAmount: number;
  if (discount.type === DiscountType.PERCENT) {
    discountAmount = Math.floor((orderTotal * discount.value) / 100);
  } else {
    discountAmount = Math.min(discount.value, orderTotal);
  }

  return {
    valid: true,
    discountAmount,
    discountId: discount.id,
    type: discount.type as "PERCENT" | "FLAT",
    value: discount.value,
  };
}

export async function getAllDiscountCodes() {
  return prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createDiscountCode(data: {
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrder?: number;
  maxUses?: number;
  active?: boolean;
  expiresAt?: string | null;
}) {
  return prisma.discountCode.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type as DiscountType,
      value: data.value,
      minOrder: data.minOrder,
      maxUses: data.maxUses,
      active: data.active ?? true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

export async function updateDiscountCode(
  id: number,
  data: {
    code?: string;
    type?: "PERCENT" | "FLAT";
    value?: number;
    minOrder?: number;
    maxUses?: number;
    active?: boolean;
    expiresAt?: string | null;
  }
) {
  return prisma.discountCode.update({
    where: { id },
    data: {
      ...(data.code !== undefined ? { code: data.code.toUpperCase() } : {}),
      ...(data.type !== undefined ? { type: data.type as DiscountType } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.minOrder !== undefined ? { minOrder: data.minOrder } : {}),
      ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
    },
  });
}

export async function deleteDiscountCode(id: number): Promise<void> {
  await prisma.discountCode.delete({ where: { id } });
}

export async function incrementUsedCount(id: number): Promise<void> {
  await prisma.discountCode.update({
    where: { id },
    data: { usedCount: { increment: 1 } },
  });
}
