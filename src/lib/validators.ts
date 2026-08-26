import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.number().int().positive(),
  size: z.string().min(1),
  amount: z.number().int().positive(),
});

export const deliveryAddressSchema = z.object({
  name:    z.string().min(2),
  phone:   z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1:   z.string().min(5),
  city:    z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size: z.string().min(1),
        // Still accepted because clients send it, but the route ignores it and
        // reprices from the DB. Money never comes off the wire.
        amount: z.number().int().positive().optional(),
      })
    )
    .min(1),
  address: deliveryAddressSchema,
  discountCode: z.string().optional(),
  // Likewise advisory: the real figure is revalidated server-side.
  discountAmount: z.number().int().nonnegative().optional(),
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
  tagId: z.number().int().positive().nullable().optional(),
  base: z.number().int().positive(),
  priceA3: z.number().int().positive().optional(),
  priceA2: z.number().int().positive().optional(),
  sub: z.string().min(1),
  active: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  tamil: z.string().min(1).optional(),
  tagId: z.number().int().positive().nullable().optional(),
  base: z.number().int().positive().optional(),
  priceA3: z.number().int().positive().optional(),
  priceA2: z.number().int().positive().optional(),
  sub: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

/** Tag labels are chips in a single scrolling row — keep them short. */
export const createTagSchema = z.object({
  label: z.string().trim().min(1).max(24),
});

export const updateTagSchema = z.object({
  label: z.string().trim().min(1).max(24).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const validateDiscountSchema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().min(0),
});

export const createDiscountCodeSchema = z.object({
  code: z.string().min(2).max(20).toUpperCase(),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive(),
  minOrder: z.number().int().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateDiscountCodeSchema = createDiscountCodeSchema.partial();
