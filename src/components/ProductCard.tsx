import Link from "next/link";
import { money } from "@/lib/data";
import type { Product } from "@/lib/data";

interface ProductCardProps {
  product: Product;
  dark?: boolean;
}

export function ProductCard({ product, dark = false }: ProductCardProps) {
  return (
    <div>
      <Link href={`/shop/${product.slug}`} className="block group">
        <div
          className="aspect-[3/4] flex items-center justify-center text-center border p-3 md:p-[18px] transition-colors relative"
          style={{
            background: dark
              ? "repeating-linear-gradient(38deg,#2b251d 0 8px,#211c15 8px 16px)"
              : "repeating-linear-gradient(38deg,#eae1cb 0 9px,#f4ecdc 9px 18px)",
            borderColor: dark ? "#3a332a" : "#d9cfb8",
          }}
        >
          {!dark && (
            <span
              className="absolute left-2 top-2 font-mono text-[8px] md:text-[9px] tracking-[.12em]"
              style={{ color: "#8d8371" }}
            >
              {product.tag}
            </span>
          )}
          <span
            className="font-anek font-bold leading-[1.35]"
            style={{
              fontSize: dark ? "clamp(14px,3.5vw,22px)" : "clamp(18px,4vw,30px)",
              color: dark ? "#f4ecdc" : "#1a1713",
            }}
          >
            {product.tamil}
          </span>
        </div>
      </Link>
      <div className="flex justify-between gap-2 mt-2.5 md:mt-3 items-baseline">
        <Link
          href={`/shop/${product.slug}`}
          className="font-bakbak text-[13px] md:text-[15px] hover:text-[#e8452c] leading-tight"
        >
          {product.title}
        </Link>
        <span className="font-mono text-[11px] md:text-[12px] shrink-0">{money(product.base)}</span>
      </div>
      {!dark && (
        <div className="text-[11.5px] md:text-[13px] mt-1 leading-snug" style={{ color: "#6e6455" }}>
          {product.sub}
        </div>
      )}
    </div>
  );
}
