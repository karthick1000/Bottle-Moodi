export interface ProductImage {
  id: number;
  url: string;
  position: number;
}

export interface Tag {
  id: number;
  label: string;
  position: number;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  tamil: string;
  /** Null once the tag it carried is deleted. */
  tag: Tag | null;
  /** Price of the A4 print. */
  base: number;
  priceA3: number;
  priceA2: number;
  /** Poster description, editable from /minad. */
  sub: string;
  active?: boolean;
  images?: ProductImage[];
}

export const SIZES = ["A4", "A3", "A2"] as const;
export type Size = typeof SIZES[number];

/**
 * Upcharges applied on top of `base` when a product has no explicit A3/A2
 * price. Every product now carries its own per-size prices, so this is only
 * the seed used for new drafts and the fallback for stale/partial records.
 */
export const SIZE_UPCHARGE: Record<Size, number> = { A4: 0, A3: 150, A2: 350 };

/** The subset of a product needed to price it — DB rows and API payloads both fit. */
export interface SizePricing {
  base: number;
  priceA3?: number | null;
  priceA2?: number | null;
}

/** Price of `product` in `size`, falling back to the legacy upcharge. */
export function priceFor(product: SizePricing, size: Size): number {
  if (size === "A3") return product.priceA3 ?? product.base + SIZE_UPCHARGE.A3;
  if (size === "A2") return product.priceA2 ?? product.base + SIZE_UPCHARGE.A2;
  return product.base;
}

/**
 * Delivery defaults, used until the admin saves their own in /minad and as the
 * first-paint value before the saved rule reaches the client.
 */
export const SHIPPING_DEFAULTS: ShippingRule = { fee: 79, freeAbove: 999 };

export interface ShippingRule {
  /** Flat delivery fee charged on orders below `freeAbove`. */
  fee: number;
  /** Subtotal at or above which delivery is free. 0 makes every order free. */
  freeAbove: number;
}

/**
 * Delivery charged on a cart subtotal. Compared against the subtotal *before*
 * any discount code, so a code can never be what unlocks free delivery.
 */
export function shippingFor(subtotal: number, rule: ShippingRule): number {
  if (subtotal <= 0) return 0;
  return subtotal >= rule.freeAbove ? 0 : rule.fee;
}

export const money = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

/** Tags seeded into the Tag table on first migrate. Not read at runtime. */
export const TAGS_SEED = ["SIGNBOARD", "OORU", "SLANG", "NOSTALGIA"] as const;
