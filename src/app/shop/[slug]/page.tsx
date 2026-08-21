"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, SIZES, SIZE_UPCHARGE, money, type Size } from "@/lib/data";
import { useCartStore } from "@/lib/store";
import { AddedToast } from "@/components/AddedToast";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = PRODUCTS.find((p) => p.slug === slug);

  if (!product) notFound();

  const [size, setSize] = useState<Size>("A3");
  const [toast, setToast] = useState<string | null>(null);
  const { addItem, openCart } = useCartStore();

  const price = product.base + SIZE_UPCHARGE[size];

  const handleAdd = () => {
    addItem({ productId: product.id, title: product.title, tamil: product.tamil, size, base: product.base });
    setToast(`${product.title} · ${size}`);
    openCart();
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-7 pt-6 md:pt-8 pb-16 md:pb-[96px]">
      <Link
        href="/shop"
        className="font-mono text-[11px] md:text-[12px] tracking-[.12em] text-[#6e6455] hover:text-dark inline-flex items-center gap-1"
      >
        ← BACK TO KADAI
      </Link>

      {/* Stack on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 mt-5 md:mt-6 items-start gap-6 md:gap-[64px]">
        {/* poster preview */}
        <div
          className="hatch-light border border-[#d9cfb8] flex items-center justify-center text-center px-8 md:px-11 py-10 md:py-14"
          style={{ aspectRatio: "3/4" }}
        >
          <span
            className="font-anek font-bold leading-[1.3]"
            style={{ fontSize: "clamp(28px,5vw,60px)" }}
          >
            {product.tamil}
          </span>
        </div>

        {/* details */}
        <div className="pt-1">
          <span className="font-bakbak text-[11px] md:text-[12px] tracking-[.24em] text-[#e8452c]">
            {product.tag}
          </span>
          <h1
            className="mt-3 font-bakbak leading-[1.02]"
            style={{ fontSize: "clamp(28px,4.4vw,56px)" }}
          >
            {product.title}
          </h1>
          <div className="font-mono text-[15px] md:text-[16px] mt-3">{money(price)}</div>
          <p
            className="mt-4 text-[15px] md:text-[16.5px] leading-[1.65] text-[#453d33]"
            style={{ maxWidth: "46ch" }}
          >
            {product.sub} Matte 250gsm uncoated stock, unframed, shipped rolled in a hard tube.
          </p>

          <div className="font-mono text-[10px] md:text-[10.5px] tracking-[.16em] text-[#6e6455] mt-7 mb-2.5">
            SIZE
          </div>
          <div className="flex gap-2 flex-wrap">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className="font-inter text-[13px] md:text-[13.5px] font-medium px-4 md:px-5 py-2.5 md:py-3 border-[1.5px] border-dark rounded-sm cursor-pointer transition-colors min-h-[44px]"
                style={{
                  background: s === size ? "#1a1713" : "transparent",
                  color: s === size ? "#f4ecdc" : "#1a1713",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={handleAdd}
            className="w-full max-w-[400px] mt-6 md:mt-7 border-none bg-dark text-cream font-bakbak text-[15px] md:text-[16px] py-4 md:py-[18px] px-6 rounded-sm tracking-[.04em] hover:bg-[#e8452c] transition-colors cursor-pointer min-h-[52px]"
          >
            ADD TO BAG
          </button>

          <div className="border-t border-[#d9cfb8] mt-7 md:mt-9 pt-4 grid gap-2 text-[12.5px] md:text-[13.5px] text-[#6e6455]">
            <div>Dispatch in 3 working days · India-wide shipping</div>
            <div>Damaged in transit? We reprint, no questions.</div>
          </div>
        </div>
      </div>

      {toast && <AddedToast label={toast} onDone={() => setToast(null)} />}
    </main>
  );
}
