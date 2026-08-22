"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { money, SHIPPING } from "@/lib/data";

// ── Razorpay global type ─────────────────────────────────────────────────────

type RazorpayPaymentResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill?: { name?: string; contact?: string };
      theme?: { color?: string };
      handler: (result: RazorpayPaymentResult) => void;
      modal?: { ondismiss?: () => void };
    }) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Validation helpers ────────────────────────────────────────────────────────

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
type ToastKind  = "error" | "info";
type ToastState = { message: string; type: ToastKind } | null;

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [codeLoading, setCodeLoading] = useState(false);

  const [paying, setPaying]         = useState(false);

  const [toast, setToast]           = useState<ToastState>(null);
  const toastTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: ToastKind = "error") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

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

  // ── Field change + blur ────────────────────────────────────────────────────

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

  // ── Discount apply ─────────────────────────────────────────────────────────

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
        setCodeMsg({ text: "✓ Code applied", ok: true });
      } else {
        setDiscount(0);
        setCodeMsg({ text: data.message ?? "Invalid code", ok: false });
      }
    } catch {
      setCodeMsg({ text: "Could not validate code", ok: false });
    } finally {
      setCodeLoading(false);
    }
  };

  // ── Payment flow ───────────────────────────────────────────────────────────

  const handlePayment = async () => {
    // Touch all fields to surface validation errors
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

    if (Object.values(newErrors).some(Boolean)) {
      showToast("Please fill in all delivery details correctly.");
      return;
    }
    if (items.length === 0) {
      showToast("Your bag is empty.");
      return;
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      showToast("Payment gateway is not configured. Please contact support.");
      return;
    }

    setPaying(true);

    try {
      // 1. Load Razorpay checkout.js
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Could not load payment gateway. Please refresh and try again.");
        return;
      }

      // 2. Create Razorpay order on the server (amount in paise)
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total * 100 }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        showToast(err.error ?? "Failed to initiate payment. Please try again.");
        return;
      }

      const { id: razorpayOrderId, amount: rzpAmount, currency } = await createRes.json();

      // 3. Open Razorpay modal — wait for success or dismiss
      const paymentResult = await new Promise<RazorpayPaymentResult>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount: rzpAmount,
          currency,
          name: "பாட்டில் மூடி",
          description: `${items.length} poster${items.length > 1 ? "s" : ""}`,
          order_id: razorpayOrderId,
          prefill: {
            name: form.name.trim(),
            contact: form.phone.replace(/\D/g, ""),
          },
          theme: { color: "#e8452c" },
          handler: resolve,
          modal: { ondismiss: () => reject(new Error("CANCELLED")) },
        });
        rzp.open();
      });

      // 4. Verify payment signature and create the order
      const verifyRes = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId:  paymentResult.razorpay_order_id,
          razorpayPaymentId: paymentResult.razorpay_payment_id,
          razorpaySignature: paymentResult.razorpay_signature,
          items: items.map((i) => ({
            productId: i.productId,
            size:      i.size,
            amount:    i.amount,
          })),
          address: {
            name:    form.name.trim(),
            phone:   form.phone.replace(/\D/g, ""),
            line1:   form.address.trim(),
            city:    form.city.trim(),
            pincode: form.pincode.trim(),
          },
          ...(discount > 0 && code
            ? { discountCode: code.toUpperCase(), discountAmount: discount }
            : {}),
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        showToast(
          err.error ??
            "Payment received but order creation failed. Please contact support with your payment ID."
        );
        return;
      }

      const order = await verifyRes.json();

      // 5. Success — clear cart + session discount, navigate to confirmation
      clearCart();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bm-discount-code");
        sessionStorage.removeItem("bm-discount-amount");
      }
      router.push(`/order-confirmed?id=${order.id}`);

    } catch (err) {
      const msg = (err as Error)?.message ?? "";
      if (msg === "CANCELLED") {
        showToast("Payment cancelled. Your order has not been placed.", "info");
      } else {
        showToast(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setPaying(false);
    }
  };

  const shipping = items.length > 0 ? SHIPPING : 0;
  const total    = Math.max(0, sub - discount) + shipping;

  // ── Field renderer ──────────────────────────────────────────────────────────

  const inputCls = (field: FormField) =>
    `border-[1.5px] bg-cream px-4 py-3 md:py-3.5 font-inter text-[14px] md:text-[15px] rounded-sm outline-none focus:border-[#e8452c] min-h-[48px] w-full transition-colors ${
      touched[field] && errors[field] ? "border-[#e8452c]" : "border-dark"
    }`;

  return (
    <>
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[calc(100%-2rem)] px-4 py-3 rounded-sm font-mono text-[12px] tracking-[.02em] shadow-lg flex items-center gap-3"
          style={{
            background: toast.type === "error" ? "#e8452c" : "#1a1713",
            color: "#f4ecdc",
          }}
          role="alert"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-[18px] opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent text-inherit"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <main className="max-w-[1100px] mx-auto px-4 md:px-7 pt-8 md:pt-11 pb-16 md:pb-[96px]">
        <Link
          href="/shop"
          className="font-mono text-[11px] md:text-[12px] tracking-[.12em] text-[#6e6455] hover:text-dark"
        >
          ← KEEP SHOPPING
        </Link>
        <h1
          className="mt-4 mb-7 md:mb-8 font-bakbak leading-none"
          style={{ fontSize: "clamp(28px,4.4vw,52px)" }}
        >
          CHECKOUT
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 md:gap-14 items-start">
          {/* ── Delivery form ──────────────────────────────────────────────── */}
          <div className="grid gap-3 md:gap-4">
            <div className="font-mono text-[10px] md:text-[10.5px] tracking-[.16em] text-[#6e6455]">
              DELIVERY
            </div>

            {(["name", "phone", "address"] as const).map((field) => (
              <div key={field}>
                <input
                  placeholder={
                    field === "name"
                      ? "Full name"
                      : field === "phone"
                      ? "Phone (10 digits)"
                      : "Address"
                  }
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
            <div className="border-[1.5px] border-dark px-4 py-3.5 rounded-sm flex justify-between items-center">
              <span className="text-[13.5px] md:text-[14.5px]">UPI · Cards · Netbanking · Wallets</span>
              <span className="font-mono text-[10px] md:text-[11px] text-[#6e6455] tracking-[.08em]">
                RAZORPAY
              </span>
            </div>
            <p className="font-mono text-[10.5px] text-[#6e6455] leading-relaxed -mt-1">
              Your order is placed only after successful payment. You will be redirected to a secure Razorpay checkout.
            </p>
          </div>

          {/* ── Order summary ──────────────────────────────────────────────── */}
          <div className="border border-[#d9cfb8] p-5 md:p-6" style={{ background: "#efe6d2" }}>
            <div className="font-bakbak text-[16px] md:text-[18px] tracking-[.02em]">
              ORDER SUMMARY
            </div>

            <div className="grid gap-3 mt-4">
              {items.length === 0 ? (
                <p className="text-sm text-[#6e6455]">Your bag is empty.</p>
              ) : (
                items.map((c, i) => (
                  <div key={i} className="flex justify-between gap-3 text-[13px] md:text-[14px]">
                    <span>
                      {c.title} · {c.size}
                    </span>
                    <span className="font-mono text-[11.5px] md:text-[12.5px] shrink-0">
                      {money(c.amount)}
                    </span>
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
                  if (discount > 0) {
                    setDiscount(0);
                    setCodeMsg(null);
                  }
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
              <p
                className="font-mono text-[11px] mt-1.5"
                style={{ color: codeMsg.ok ? "#2f7d55" : "#e8452c" }}
              >
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

            <button
              onClick={handlePayment}
              disabled={items.length === 0 || paying}
              className="w-full mt-5 border-none bg-[#e8452c] text-cream font-bakbak text-[15px] md:text-[16px] py-4 md:py-[17px] rounded-sm tracking-[.04em] hover:bg-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] flex items-center justify-center gap-2"
            >
              {paying ? (
                "PROCESSING…"
              ) : (
                <>
                  PAY {money(total)}
                  <span className="font-inter text-[10px] opacity-70 font-normal tracking-normal">
                    via RAZORPAY
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
