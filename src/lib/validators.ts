import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.number().int().positive(),
  size: z.string().min(1),
  amount: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size: z.string().min(1),
        amount: z.number().int().positive(),
      })
    )
    .min(1),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]),
});

export const createProductSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  tamil: z.string().min(1),
  tag: z.string().min(1),
  base: z.number().int().positive(),
  sub: z.string().min(1),
  active: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  tamil: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  base: z.number().int().positive().optional(),
  sub: z.string().min(1).optional(),
  active: z.boolean().optional(),
});
