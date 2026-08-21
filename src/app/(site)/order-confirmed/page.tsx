"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrderConfirmedContent() {
  const params  = useSearchParams();
  const orderId = params.get("id");
  const ref     = orderId ? `#BM-${orderId}` : "";

  return (
    <main className="max-w-[640px] mx-auto px-4 md:px-7 py-16 md:py-[110px] pb-20 md:pb-[140px] text-center">
      <div className="font-kaushan text-[26px] md:text-[30px] text-[#e8452c]">Sari da!</div>
      <h1
        className="mt-3 font-bakbak leading-[1.02]"
        style={{ fontSize: "clamp(28px,5vw,52px)" }}
      >
        ORDER PLACED
      </h1>

      {/* spinning stamp cap */}
      <div className="flex justify-center mt-6 relative z-[2]">
        <div
          className="relative"
          style={{ width: "clamp(120px,40vw,180px)", height: "clamp(120px,40vw,180px)", animation: "bm-stamp .95s cubic-bezier(.3,1.5,.4,1) both" }}
        >
          {/* ripple */}
          <div
            className="absolute rounded-full border-2 border-dashed border-[#e8452c]"
            style={{ inset: -14, animation: "bm-thud 1.1s ease-out both" }}
          />
          {/* disc */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: "repeating-conic-gradient(from 0deg,#e8452c 0 4.2deg,#a82d19 4.2deg 8.4deg)",
              boxShadow: "0 10px 0 rgba(26,23,19,.14)",
              animation: "bm-spin 7s linear infinite",
              animationDelay: ".95s",
            }}
          >
            <div
              className="rounded-full flex flex-col items-center justify-center gap-1"
              style={{
                width: "76%",
                height: "76%",
                background: "#e8452c",
                boxShadow: "inset 0 0 0 2px rgba(244,236,220,.5)",
              }}
            >
              <span
                className="font-anek font-bold text-cream leading-[1.1] text-center"
                style={{ fontSize: "clamp(16px,6vw,30px)" }}
              >
                பாட்டில்
                <br />
                மூடி
              </span>
              <span className="font-mono text-[7px] md:text-[8.5px] tracking-[.18em] text-cream/75">
                APPROVED
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[15px] md:text-[16.5px] leading-[1.6] text-[#453d33]">
        {ref ? (
          <>Order <span className="font-mono font-semibold">{ref}</span> confirmed.</>
        ) : (
          <>Order confirmed.</>
        )}{" "}
        Dispatch in 3 working days, tracking by SMS. Your wall is about to get louder.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
        <Link
          href="/my-orders"
          className="inline-flex items-center justify-center border-[1.5px] border-[#e8452c] bg-[#e8452c] text-cream font-bakbak text-[14px] md:text-[15px] px-6 md:px-7 py-3.5 rounded-sm hover:bg-dark hover:border-dark transition-colors min-h-[48px]"
        >
          VIEW MY ORDERS
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center border-[1.5px] border-dark bg-transparent font-bakbak text-[14px] md:text-[15px] px-6 md:px-7 py-3.5 rounded-sm hover:bg-dark hover:text-cream transition-colors min-h-[48px]"
        >
          BACK TO KADAI
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense>
      <OrderConfirmedContent />
    </Suspense>
  );
}
