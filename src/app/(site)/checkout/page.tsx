"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { money, SHIPPING } from "@/lib/data";

// ── Validation helpers ──────────────────────────────────────────────────────

function validateName(v: string) {
  if (!v.trim()) return "Full name is required";
  if (v.trim().length < 2) return "Enter at least 2 characters";
  return "";
}

function validatePhone(v: string) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "Phone number is required";
  if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit Indian mobile number";
  return "";
}

function validateAddress(v: string) {
  if (!v.trim()) return "Address is required";
  if (v.trim().length < 5) return "Enter a complete address";
  return "";
}

function validateCity(v: string) {
  if (!v.trim()) return "City is required";
  return "";
}

function validatePincode(v: string) {
  if (!v.trim()) return "Pincode is required";
  if (!/^\d{6}$/.test(v.trim())) return "Enter a valid 6-digit pincode";
  return "";
}

type FormField = "name" | "phone" | "address" | "city" | "pincode";
type Errors = Partial<Record<FormField, string>>;

// ── Component ───────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, formattedSubtotal, formattedShipping, clearCart, subtotal } = useCartStore();
  const sub = subtotal();

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [errors, setErrors] = useState<Errors>({});

  const [code, setCode]           = useState("");
  const [codeMsg, setCodeMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [discount, setDiscount]   = useState(0);
  const [discountId, setDiscountId] = useState<number | undefined>();
  const [codeLoading, setCodeLoading] = useState(false);

  const [placing, setPlacing]     = useState(false);
  const [placeError, setPlaceError] = useState("");

  // Pre-fill discount from CartSidebar sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCode   = sessionStorage.getItem("bm-discount-code") ?? "";
    const savedAmount = parseInt(sessionStorage.getItem("bm-discount-amount") ?? "0", 10);
    if (savedCode && savedAmount > 0) {
      setCode(savedCode);
      setDiscount(savedAmount);
      setCodeMsg({ text: "✓ Code applied", ok: true });
    }
  }, []);

  // ── Field change + blur ────────────────────────────────────────────────

  const runValidators: Record<FormField, (v: string) => string> = {
    name: validateName, phone: validatePhone, address: validateAddress,
    city: validateCity, pincode: validatePincode,
  };

  const handleChange = (field: FormField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [field]: v }));
    if (touched[field]) setErrors((er) => ({ ...er, [field]: runValidators[field](v) }));
  };

  const handleBlur = (field: FormField) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((er) => ({ ...er, [field]: runValidators[field](form[field]) }));
  };

  // ── Discount apply ─────────────────────────────────────────────────────

  const applyCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCodeLoading(true);
    setCodeMsg(null);
    try {
      const res  = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, orderTotal: sub }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discountAmount);
        setDiscountId(data.discountId);
        setCodeMsg({ text: "✓ Code applied", ok: true });
      } else {
        setDiscount(0);
        setDiscountId(undefined);
        setCodeMsg({ text: data.message ?? "Invalid code", ok: false });
      }
    } catch {
      setCodeMsg({ text: "Could not validate code", ok: false });
    } finally {
      setCodeLoading(false);
    }
  };

  // ── Place order ────────────────────────────────────────────────────────

  const placeOrder = async () => {
    // Touch all fields to reveal errors
    const allTouched = { name: true, phone: true, address: true, city: true, pincode: true };
    setTouched(allTouched);

    const newErrors: Errors = {
      name:    validateName(form.name),
      phone:   validatePhone(form.phone),
      address: validateAddress(form.address),
      city:    validateCity(form.city),
      pincode: validatePincode(form.pincode),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;
    if (items.length === 0) return;

    setPlacing(true);
    setPlaceError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, size: i.size, amount: i.amount })),
          shipping: SHIPPING,
          ...(discount > 0 && code ? { discountCode: code.toUpperCase(), discountAmount: discount } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPlaceError(err.error ?? "Could not place order. Please try again.");
        return;
      }

      const order = await res.json();
      clearCart();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bm-discount-code");
        sessionStorage.removeItem("bm-discount-amount");
      }
      router.push(`/order-confirmed?id=${order.id}`);
    } catch {
      setPlaceError("Network error. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const shipping = items.length > 0 ? SHIPPING : 0;
  const total = Math.max(0, sub - discount) + shipping;

  // ── Field renderer ─────────────────────────────────────────────────────

  const inputCls = (field: FormField) =>
    `border-[1.5px] bg-cream px-4 py-3 md:py-3.5 font-inter text-[14px] md:text-[15px] rounded-sm outline-none focus:border-[#e8452c] min-h-[48px] w-full transition-colors ${
      touched[field] && errors[field] ? "border-[#e8452c]" : "border-dark"
    }`;

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

      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 md:gap-14 items-start">
        {/* ── Delivery form ── */}
        <div className="grid gap-3 md:gap-4">
          <div className="font-mono text-[10px] md:text-[10.5px] tracking-[.16em] text-[#6e6455]">
            DELIVERY
          </div>

          {(["name", "phone", "address"] as const).map((field) => (
            <div key={field}>
              <input
                placeholder={field === "name" ? "Full name" : field === "phone" ? "Phone (10 digits)" : "Address"}
                value={form[field]}
                onChange={handleChange(field)}
                onBlur={handleBlur(field)}
                inputMode={field === "phone" ? "numeric" : undefined}
                maxLength={field === "phone" ? 10 : undefined}
                className={inputCls(field)}
              />
              {touched[field] && errors[field] && (
                <p className="font-mono text-[11px] text-[#e8452c] mt-1">{errors[field]}</p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {(["city", "pincode"] as const).map((field) => (
              <div key={field}>
                <input
                  placeholder={field === "city" ? "City" : "Pincode"}
                  value={form[field]}
                  onChange={handleChange(field)}
                  onBlur={handleBlur(field)}
                  inputMode={field === "pincode" ? "numeric" : undefined}
                  maxLength={field === "pincode" ? 6 : undefined}
                  className={inputCls(field)}
                />
                {touched[field] && errors[field] && (
                  <p className="font-mono text-[11px] text-[#e8452c] mt-1">{errors[field]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="font-mono text-[10px] md:text-[10.5px] tracking-[.16em] text-[#6e6455] mt-3">
            PAYMENT
          </div>
          <div className="border-[1.5px] border-dark px-4 py-3.5 rounded-sm flex justify-between items-center text-[13.5px] md:text-[14.5px]">
            <span>UPI / Cards / Netbanking</span>
            <span className="font-mono text-[10px] md:text-[11px] text-[#6e6455]">RAZORPAY</span>
          </div>
        </div>

        {/* ── Order summary ── */}
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

          {/* Discount code */}
          <div className="flex gap-2 mt-5">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (discount > 0) { setDiscount(0); setDiscountId(undefined); setCodeMsg(null); }
              }}
              onKeyDown={(e) => e.key === "Enter" && applyCode()}
              placeholder="Discount code"
              className="flex-1 min-w-0 border-[1.5px] border-dark bg-cream px-3 py-2.5 font-mono text-[11px] md:text-[12px] rounded-sm outline-none uppercase focus:border-[#e8452c] transition-colors"
            />
            <button
              onClick={applyCode}
              disabled={codeLoading || !code.trim()}
              className="border-[1.5px] border-dark bg-transparent font-inter text-[12px] md:text-[12.5px] font-semibold px-3 md:px-[15px] py-2.5 rounded-sm cursor-pointer hover:bg-dark hover:text-cream transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {codeLoading ? "…" : "Apply"}
            </button>
          </div>
          {codeMsg && (
            <p className="font-mono text-[11px] mt-1.5" style={{ color: codeMsg.ok ? "#2f7d55" : "#e8452c" }}>
              {codeMsg.text}
            </p>
          )}

          {/* Totals */}
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
              <span>{money(total)}</span>
            </div>
          </div>

          {placeError && (
            <p className="font-mono text-[11.5px] text-[#e8452c] mt-3">{placeError}</p>
          )}

          <button
            onClick={placeOrder}
            disabled={items.length === 0 || placing}
            className="w-full mt-5 border-none bg-[#e8452c] text-cream font-bakbak text-[15px] md:text-[16px] py-4 md:py-[17px] rounded-sm tracking-[.04em] hover:bg-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            {placing ? "PLACING ORDER…" : "PLACE ORDER"}
          </button>
        </div>
      </div>
    </main>
  );
}
