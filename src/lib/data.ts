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
  base: number;
  sub: string;
  active?: boolean;
  images?: ProductImage[];
}

export const SIZES = ["A4", "A3", "A2"] as const;
export type Size = typeof SIZES[number];

export const SIZE_UPCHARGE: Record<Size, number> = { A4: 0, A3: 150, A2: 350 };

export const SHIPPING = 79;

export const money = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

export const TAGS_STATIC = ["SIGNBOARD", "OORU", "SLANG", "NOSTALGIA"] as const;
