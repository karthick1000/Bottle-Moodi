export interface Product {
  id: number;
  slug: string;
  title: string;
  tamil: string;
  tag: string;
  base: number;
  sub: string;
}

export const PRODUCTS: Product[] = [
  { id: 1, slug: "meter-podu", title: "Meter Podu", tamil: "மீட்டர் போடு", tag: "SIGNBOARD", base: 499, sub: "For the auto ride you already lost." },
  { id: 2, slug: "filter-coffee-only", title: "Filter Coffee Only", tamil: "டிகிரி காபி", tag: "OORU", base: 599, sub: "A morning position, stated firmly." },
  { id: 3, slug: "rendu-minute", title: "Rendu Minute", tamil: "ரெண்டு நிமிஷம்", tag: "SLANG", base: 399, sub: "The most elastic unit of Tamil time." },
  { id: 4, slug: "vetti-time", title: "Vetti Time", tamil: "வெட்டி நேரம்", tag: "SLANG", base: 449, sub: "Doing nothing, professionally." },
  { id: 5, slug: "bus-stand-blues", title: "Bus Stand Blues", tamil: "நிற்கும் இடம்", tag: "NOSTALGIA", base: 699, sub: "Blue paint, red dust, one late bus." },
  { id: 6, slug: "kadalai-podu", title: "Kadalai Podu", tamil: "கடலை போடு", tag: "SLANG", base: 449, sub: "Flirting, as described by peanuts." },
  { id: 7, slug: "semma-scene", title: "Semma Scene", tamil: "செம்ம சீன்", tag: "OORU", base: 549, sub: "Said about anything, means everything." },
  { id: 8, slug: "sapten-thoongiten", title: "Sapten Thoongiten", tamil: "சாப்டேன் தூங்கிட்டேன்", tag: "NOSTALGIA", base: 599, sub: "A full life summarised in two verbs." },
  { id: 9, slug: "ille-ille", title: "Ille Ille", tamil: "இல்லை இல்லை", tag: "SIGNBOARD", base: 399, sub: "Denial, printed twice for emphasis." },
];

export const SIZES = ["A4", "A3", "A2"] as const;
export type Size = typeof SIZES[number];

export const SIZE_UPCHARGE: Record<Size, number> = { A4: 0, A3: 150, A2: 350 };

export const SHIPPING = 79;

export const money = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

export const TAGS = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.tag)))];
