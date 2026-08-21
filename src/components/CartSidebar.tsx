"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { money, SHIPPING } from "@/lib/data";
import { useRouter } from "next/navigation";

export function CartSidebar() {
  const { items, cartOpen, toggleCart, closeCart, removeItem, formattedSubtotal, subtotal } = useCartStore();
  const router = useRouter();

  const [discountCode,    setDiscountCode]    = useState("");
  const [discountAmount,  setDiscountAmount]  = useState(0);
  const [discountMsg,     setDiscountMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  if (!cartOpen) return null;

  const sub = subtotal();
  const shipping = items.length > 0 ? SHIPPING : 0;
  const total = sub + shipping - discountAmount;

  const applyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountMsg(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: sub }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountAmount(data.discountAmount);
        setDiscountMsg({ text: "✓ Code applied", ok: true });
      } else {
        setDiscountAmount(0);
        setDiscountMsg({ text: data.message ?? "Invalid code", ok: false });
      }
    } catch {
      setDiscountMsg({ text: "Could not validate code", ok: false });
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleCheckout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bm-discount-code",   discountCode);
      sessionStorage.setItem("bm-discount-amount",  String(discountAmount));
    }
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 60 }}>
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,23,19,.5)" }}
        onClick={toggleCart}
      />
      <aside className="relative w-[min(400px,92vw)] bg-cream border-l border-dark flex flex-col">
        {/* header */}
        <div className="flex justify-between items-center px-5 md:px-6 py-4 border-b border-[#d9cfb8]">
          <span className="font-bakbak text-[20px] md:text-[22px]">YOUR BAG</span>
          <button
            onClick={toggleCart}
            className="border-none bg-transparent text-[22px] text-muted cursor-pointer w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#efe6d2] transition-colors"
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-[#6e6455] mt-4">Nothing here yet. Go pick a wall.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-[48px] h-[64px] md:w-[52px] md:h-[68px] flex-none hatch-light border border-[#d9cfb8] rounded-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bakbak text-[14px] md:text-[15px] truncate">{item.title}</div>
                    <div className="font-mono text-[10.5px] md:text-[11px] text-[#6e6455] mt-0.5">
                      {item.size} · {money(item.amount)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    className="cursor-pointer border-none bg-transparent font-mono text-[9.5px] md:text-[10px] text-[#6e6455] tracking-[.1em] py-2 px-1 min-h-[40px] hover:text-[#e8452c] transition-colors"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t-[1.5px] border-dark px-5 md:px-6 py-4">
          {/* Subtotal */}
          <div className="flex justify-between font-mono text-[12.5px] md:text-[13px]">
            <span>SUBTOTAL</span>
            <span>{formattedSubtotal()}</span>
          </div>

          {/* Discount row */}
          {discountAmount > 0 && (
            <div className="flex justify-between font-mono text-[12px] mt-1" style={{ color: "#e8452c" }}>
              <span>DISCOUNT</span>
              <span>−{money(discountAmount)}</span>
            </div>
          )}

          {/* Discount code input */}
          <div className="flex gap-2 mt-3">
            <input
              value={discountCode}
              onChange={e => {
                setDiscountCode(e.target.value.toUpperCase());
                if (discountAmount > 0) { setDiscountAmount(0); setDiscountMsg(null); }
              }}
              placeholder="Discount code"
              className="flex-1 min-w-0 border border-[#d9cfb8] rounded-sm px-3 py-2 font-mono text-[12px] bg-transparent outline-none focus:border-[#e8452c] transition-colors"
              style={{ textTransform: "uppercase" }}
              onKeyDown={e => e.key === "Enter" && applyDiscount()}
            />
            <button
              onClick={applyDiscount}
              disabled={discountLoading || !discountCode.trim()}
              className="border border-dark bg-transparent font-bakbak text-[12px] px-3 py-2 rounded-sm cursor-pointer hover:bg-dark hover:text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {discountLoading ? "…" : "APPLY"}
            </button>
          </div>

          {/* Discount message */}
          {discountMsg && (
            <div
              className="font-mono text-[11px] mt-1.5"
              style={{ color: discountMsg.ok ? "#2f7d55" : "#e8452c" }}
            >
              {discountMsg.text}
            </div>
          )}

          {/* Total */}
          {(discountAmount > 0) && (
            <div className="flex justify-between font-mono text-[13px] md:text-[14px] font-semibold mt-2 pt-2 border-t border-[#d9cfb8]">
              <span>TOTAL</span>
              <span>{money(total)}</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            className="w-full mt-3 border-none bg-dark text-cream font-bakbak text-[14px] md:text-[15px] py-4 rounded-sm tracking-[.04em] hover:bg-[#e8452c] transition-colors cursor-pointer min-h-[52px]"
          >
            CHECKOUT
          </button>
        </div>
      </aside>
    </div>
  );
}
