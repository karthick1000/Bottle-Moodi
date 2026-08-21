"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedCap } from "@/components/AnimatedCap";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/data";

const featured = PRODUCTS.slice(0, 4);

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [subMsg, setSubMsg] = useState("");

  const subscribe = () => {
    if (email.includes("@")) {
      setSubMsg("Sari. You're on the list.");
      setEmail("");
    } else {
      setSubMsg("That email looks suspicious.");
    }
  };

  return (
    <main>
      <AnimatedCap heroSlotId="bm-hero-slot" headerSlotId="bm-top-slot" />

      {/* ── Hero ── */}
      <section className="bg-dark text-cream pt-3.5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-7 pb-12 md:pb-[76px] text-center border-x border-[#3a332a]">
          <div className="border-t-[3px] border-double border-[#e8452c] border-b border-[#3a332a] py-2.5 mb-8 md:mb-16 font-bakbak text-[10px] md:text-[12px] tracking-[.3em] md:tracking-[.42em] text-[#c4b79c]">
            NOW SHOWING · POSTERS · CHENNAI
          </div>

          {/* hero cap slot — sized smaller on mobile */}
          <div className="flex justify-center">
            <div
              id="bm-hero-slot"
              style={{ width: "clamp(80px,18vw,230px)", aspectRatio: "1" }}
            />
          </div>

          <h1
            className="mt-4 md:mt-6 mx-auto font-bakbak leading-[1.12] tracking-[-0.01em]"
            style={{ fontSize: "clamp(38px,9.5vw,140px)", maxWidth: "16ch" }}
          >
            <span className="text-cream">NORMAL</span>{" "}
            <span style={{ color: "transparent", WebkitTextStroke: "2px #c4b79c" }}>IS</span>{" "}
            <span
              className="font-kaushan inline-block"
              style={{ fontSize: ".82em", transform: "rotate(-3deg)", color: "#e9b44c" }}
            >
              not
            </span>{" "}
            <span className="text-cream">OUR</span>{" "}
            <span className="text-cream border-b-[.09em] border-[#e8452c]">SIZE</span>
          </h1>

          <p
            className="mt-6 md:mt-14 mx-auto font-anek font-medium text-[#c4b79c] leading-relaxed"
            style={{ fontSize: "clamp(15px,2vw,23px)", maxWidth: "32ch" }}
          >
            சுவர் ஒட்டி கலகம்
          </p>

          <div className="flex gap-3 mt-7 md:mt-10 flex-wrap justify-center">
            <Link
              href="/shop"
              className="border-none bg-[#e8452c] text-cream font-bakbak text-[14px] md:text-[16px] px-6 md:px-[34px] py-3.5 md:py-4 rounded-sm tracking-[.04em] hover:bg-cream hover:text-dark transition-colors"
            >
              SHOP THE POSTERS
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tagline Banner ── */}
      <div className="bg-[#e8452c] text-cream border-y border-dark py-5 md:py-6 px-4 md:px-6 text-center">
        <div
          className="font-bakbak tracking-[.01em]"
          style={{ fontSize: "clamp(18px,3.4vw,42px)" }}
        >
          Bottle Moodi —{" "}
          <span className="font-anek font-bold">Mood-க்கு ஏத்த Design</span>
        </div>
      </div>

      {/* ── Story ── */}
      <section
        id="story"
        className="max-w-[1400px] mx-auto px-4 md:px-7 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start"
        style={{ scrollMarginTop: 70 }}
      >
        <div>
          <span className="font-bakbak text-[11px] md:text-[12px] tracking-[.3em] text-[#e8452c]">
            REEL 01 — THE NAME
          </span>
          <h2
            className="mt-4 md:mt-5 font-bakbak leading-[1.02]"
            style={{ fontSize: "clamp(28px,4.6vw,62px)", maxWidth: "22ch" }}
          >
            A bottle cap is useless. Until it isn&apos;t.
          </h2>
          <p className="mt-5 text-[15px] md:text-[17px] leading-[1.65] text-[#453d33]" style={{ maxWidth: "56ch" }}>
            Bottlemoodi is the small thing nobody frames and everybody keeps. We make posters out of
            the Tamil that lives in group chats, bus windows and shop signboards — the language that
            never makes it to the gallery wall.
          </p>
          <p className="mt-4 text-[15px] md:text-[17px] leading-[1.65] text-[#453d33]" style={{ maxWidth: "56ch" }}>
            Every print is designed in-house on matte 250gsm uncoated stock and shipped rolled in a
            hard tube. No frames, no fuss. Stick it up, argue about it later.
          </p>

          <div
            className="mt-8 md:mt-11 grid grid-cols-3 gap-px border border-[#d9cfb8]"
            style={{ background: "#d9cfb8" }}
          >
            {[
              { val: "250", label: "GSM MATTE" },
              { val: "3", label: "DAY DISPATCH" },
              { val: "A2", label: "BIGGEST SIZE" },
            ].map(({ val, label }) => (
              <div key={label} className="bg-cream p-4 md:p-5">
                <div className="font-bakbak text-[24px] md:text-[30px]">{val}</div>
                <div className="font-mono text-[9px] md:text-[10px] tracking-[.14em] text-[#6e6455] mt-1.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* studio photo placeholder — hidden on mobile to save space */}
        <div
          className="hidden lg:flex border border-[#d9cfb8] hatch-light items-center justify-center text-center p-6"
          style={{ aspectRatio: "4/5" }}
        >
          <span className="font-mono text-[11px] tracking-[.1em] text-[#6e6455] leading-[1.8]">
            [ STUDIO PHOTO ]
            <br />
            posters on a wall
            <br />
            drop image here
          </span>
        </div>
      </section>

      {/* ── Latest Four ── */}
      <section className="bg-dark text-cream py-16 md:py-[92px]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-7">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-8 md:mb-11">
            <div>
              <span className="font-bakbak text-[11px] md:text-[12px] tracking-[.3em] text-[#e8452c]">
                REEL 02 — THE WALL
              </span>
              <h2
                className="mt-3 md:mt-4 font-bakbak leading-none"
                style={{ fontSize: "clamp(28px,4.2vw,56px)" }}
              >
                Latest four
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-[#e8452c] font-bakbak text-[12px] md:text-[13px] tracking-[.16em] hover:underline"
            >
              ALL PRINTS →
            </Link>
          </div>
          {/* 2-col on mobile, 4-col on large screens */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-[22px]">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} dark />
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon ── */}
      <section
        id="soon"
        className="max-w-[1400px] mx-auto px-4 md:px-7 py-16 md:py-[92px] grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] items-center"
        style={{ scrollMarginTop: 70 }}
      >
        <div>
          <span className="font-bakbak text-[11px] md:text-[12px] tracking-[.3em] text-[#e8452c]">
            REEL 03 — NEXT
          </span>
          <h2
            className="mt-4 font-bakbak leading-[1.02]"
            style={{ fontSize: "clamp(28px,4.2vw,56px)", maxWidth: "18ch" }}
          >
            Tees, totes, and other trouble.
          </h2>
          <p className="mt-4 text-[15px] md:text-[17px] leading-[1.65] text-[#453d33]" style={{ maxWidth: "48ch" }}>
            Posters first. Wearables when we get the fabric right. Leave your email and you&apos;ll
            hear about it before Instagram does.
          </p>
          <div className="flex gap-2 mt-6 md:mt-7 w-full max-w-[440px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 border-[1.5px] border-dark bg-cream px-3 md:px-4 py-3 md:py-3.5 font-inter text-[14px] md:text-[15px] rounded-sm outline-none focus:border-[#e8452c]"
            />
            <button
              onClick={subscribe}
              className="flex-none border-none bg-dark text-cream font-bakbak text-[13px] md:text-[15px] px-4 md:px-6 py-3 md:py-3.5 rounded-sm hover:bg-[#e8452c] transition-colors cursor-pointer whitespace-nowrap"
            >
              NOTIFY ME
            </button>
          </div>
          {subMsg && (
            <div className="font-mono text-[11px] text-[#6e6455] mt-3">{subMsg}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-3.5">
          <div className="aspect-square border border-[#d9cfb8] hatch-light flex items-center justify-center">
            <span className="font-mono text-[9px] md:text-[10px] text-[#6e6455]">[ TEE MOCKUP ]</span>
          </div>
          <div className="aspect-square border border-dark bg-[#e8452c] flex items-center justify-center p-3 md:p-4 text-center">
            <span className="font-bakbak text-[18px] md:text-[22px] leading-[1.1] text-cream">
              SOON
              <br />
              DA
            </span>
          </div>
          <div className="aspect-square border border-dark bg-dark flex items-center justify-center p-3 md:p-4 text-center">
            <span className="font-anek font-bold text-[15px] md:text-[19px] text-cream">
              அப்பறம் வாங்க
            </span>
          </div>
          <div className="aspect-square border border-[#d9cfb8] hatch-light flex items-center justify-center">
            <span className="font-mono text-[9px] md:text-[10px] text-[#6e6455]">[ TOTE MOCKUP ]</span>
          </div>
        </div>
      </section>
    </main>
  );
}
