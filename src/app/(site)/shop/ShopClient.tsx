"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { BottleShape } from "@/components/BottleShape";
import type { Product, Tag } from "@/lib/data";

/** Sentinel for the unfiltered chip. Not a tag id, so it can't collide with one. */
const ALL = -1;

interface Props {
  products: Product[];
  tags: Tag[];
}

export function ShopClient({ products, tags }: Props) {
  const [filter, setFilter] = useState<number>(ALL);
  const [loading, setLoading] = useState(false);

  // Only offer chips that actually have posters behind them — an empty grid
  // reads as a broken page, and the admin can add a tag before using it.
  const chips = useMemo(() => {
    const used = new Set(products.map((p) => p.tag?.id).filter((id): id is number => id != null));
    return [
      { id: ALL, label: "All" },
      ...tags.filter((t) => used.has(t.id)).map((t) => ({ id: t.id, label: t.label })),
    ];
  }, [products, tags]);

  const handleFilter = (id: number) => {
    if (id === filter) return;
    setLoading(true);
    setTimeout(() => {
      setFilter(id);
      setLoading(false);
    }, 420);
  };

  const visible = products.filter((p) => filter === ALL || p.tag?.id === filter);

  return (
    <main className="w-full max-w-[1400px] mx-auto px-4 md:px-7 py-10 md:py-[52px] pb-16 md:pb-[96px]">
      <div className="flex items-end justify-between gap-4 flex-wrap border-b-[3px] border-double border-dark pb-4 md:pb-5">
        <div className="min-w-0">
          <span className="font-bakbak text-[11px] md:text-[12px] tracking-[.3em] text-[#e8452c]">
            KADAI
          </span>
          <h1
            className="mt-2 md:mt-3 font-bakbak leading-[.98]"
            style={{ fontSize: "clamp(28px,5vw,66px)" }}
          >
            ALL POSTERS
          </h1>
        </div>
        <span className="font-mono text-[11px] md:text-[12px] text-[#6e6455] shrink-0">
          {visible.length} PRINTS
        </span>
      </div>

      {/* filter chips — horizontal scroll on mobile */}
      <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 my-5 md:my-6 md:flex-wrap scrollbar-hide">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleFilter(chip.id)}
            className="flex-none font-inter text-[12px] md:text-[13px] font-medium px-3.5 md:px-4 py-2.5 rounded-sm border-[1.5px] border-dark cursor-pointer transition-colors min-h-[40px]"
            style={{
              background: chip.id === filter ? "#1a1713" : "transparent",
              color: chip.id === filter ? "#f4ecdc" : "#1a1713",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3.5 py-[90px]">
          <BottleShape
            width={46}
            height={77}
            loopAnimate
            outerColor="#1a1713"
            innerBg="#f4ecdc"
            fillColor="#e8452c"
            showCap
          />
          <span className="font-mono text-[11px] tracking-[.16em] text-[#6e6455]">
            FILLING UP…
          </span>
        </div>
      ) : (
        /* 2-col on mobile, 2-col on tablet, 3-col on desktop */
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-8 md:gap-x-[26px] md:gap-y-[34px]">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
