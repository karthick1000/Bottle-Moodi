export interface ProductImage {
  id: number;
  url: string;
  position: number;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  tamil: string;
  tag: string;
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

export const SHIPPING = 79;

export const money = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

export const TAGS_STATIC = ["SIGNBOARD", "OORU", "SLANG", "NOSTALGIA"] as const;
