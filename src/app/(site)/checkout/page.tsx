"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { money } from "@/lib/data";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, formattedSubtotal, formattedShipping, formattedTotal, clearCart } = useCartStore();

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = useCartStore((s) => s.subtotal());

  const applyCode = () => {
    const c = code.trim().toUpperCase();
    if (c === "MOODI10") {
      setDiscount(Math.round(subtotal * 0.1));
      setCodeMsg("MOODI10 applied — 10% off.");
    } else {
      setDiscount(0);
      setCodeMsg(c ? "That code doesn't work here." : "");
    }
  };

  const placeOrder = () => {
    clearCart();
    router.push("/order-confirmed");
  };

  const discountedTotal = money(Math.max(0, subtotal - discount) + (items.length > 0 ? 79 : 0));

  return (
    <main className="max-w-[1100px] mx-auto px-4 md:px-7 pt-8 md:pt-11 pb-16 md:pb-[96px]">
      <Link href="/shop" className="font-mono text-[11px] md:text-[12px] tracking-[.12em] text-[#6e6455] hover:text-dark">
        ← KEEP SHOPPING
      </Link>
      <h1
        className="mt-4 mb-7 md:mb-8 font-bakbak leading-none"
        style={{ fontSize: "clamp(28px,4.4vw,52px)" }}
      >
        CHECKOUT
      </h1>

      {/* Stack on mobile: form first, then summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 md:gap-14 items-start">
        {/* delivery form */}
        <div className="grid gap-3 md:gap-4">
          <div className="font-mono text-[10px] md:text-[10.5px] tracking-[.16em] text-[#6e6455]">
            DELIVERY
          </div>
          {(["name", "phone", "address"] as const).map((field) => (
            <input
              key={field}
              placeholder={field === "name" ? "Full name" : field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="border-[1.5px] border-dark bg-cream px-4 py-3 md:py-3.5 font-inter text-[14px] md:text-[15px] rounded-sm outline-none focus:border-[#e8452c] min-h-[48px]"
            />
          ))}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border-[1.5px] border-dark bg-cream px-4 py-3 md:py-3.5 font-inter text-[14px] md:text-[15px] rounded-sm outline-none focus:border-[#e8452c] min-h-[48px]"
            />
            <input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="border-[1.5px] border-dark bg-cream px-4 py-3 md:py-3.5 font-inter text-[14px] md:text-[15px] rounded-sm outline-none focus:border-[#e8452c] min-h-[48px]"
            />
          </div>

          <div className="font-mono text-[10px] md:text-[10.5px] tracking-[.16em] text-[#6e6455] mt-3">
            PAYMENT
          </div>
          <div className="border-[1.5px] border-dark px-4 py-3.5 rounded-sm flex justify-between items-center text-[13.5px] md:text-[14.5px]">
            <span>UPI / Cards / Netbanking</span>
            <span className="font-mono text-[10px] md:text-[11px] text-[#6e6455]">RAZORPAY</span>
          </div>
        </div>

        {/* order summary */}
        <div className="border border-[#d9cfb8] p-5 md:p-6" style={{ background: "#efe6d2" }}>
          <div className="font-bakbak text-[16px] md:text-[18px] tracking-[.02em]">ORDER SUMMARY</div>

          <div className="grid gap-3 mt-4">
            {items.length === 0 ? (
              <p className="text-sm text-[#6e6455]">Your bag is empty.</p>
            ) : (
              items.map((c, i) => (
                <div key={i} className="flex justify-between gap-3 text-[13px] md:text-[14px]">
                  <span>{c.title} · {c.size}</span>
                  <span className="font-mono text-[11.5px] md:text-[12.5px] shrink-0">{money(c.amount)}</span>
                </div>
              ))
            )}
          </div>

          {/* discount code */}
          <div className="flex gap-2 mt-5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Discount code"
              className="flex-1 min-w-0 border-[1.5px] border-dark bg-cream px-3 py-2.5 font-mono text-[11px] md:text-[12px] rounded-sm outline-none uppercase"
            />
            <button
              onClick={applyCode}
              className="border-[1.5px] border-dark bg-transparent font-inter text-[12px] md:text-[12.5px] font-semibold px-3 md:px-[15px] py-2.5 rounded-sm cursor-pointer hover:bg-dark hover:text-cream transition-colors whitespace-nowrap"
            >
              Apply
            </button>
          </div>
          {codeMsg && (
            <div className="font-mono text-[11px] text-[#e8452c] mt-2">{codeMsg}</div>
          )}

          <div className="border-t border-[#d9cfb8] mt-5 pt-4 grid gap-2 text-[13.5px] md:text-[14px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formattedSubtotal()}</span>
            </div>
            <div className="flex justify-between text-[#6e6455]">
              <span>Shipping</span>
              <span className="font-mono">{formattedShipping()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#e8452c]">
                <span>Discount</span>
                <span className="font-mono">−{money(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bakbak text-[17px] md:text-[18px] mt-1.5">
              <span>TOTAL</span>
              <span>{discount > 0 ? discountedTotal : formattedTotal()}</span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={items.length === 0}
            className="w-full mt-5 border-none bg-[#e8452c] text-cream font-bakbak text-[15px] md:text-[16px] py-4 md:py-[17px] rounded-sm tracking-[.04em] hover:bg-dark transition-colors cursor-pointer disabled:opacity-50 min-h-[52px]"
          >
            PLACE ORDER
          </button>
        </div>
      </div>
    </main>
  );
}
