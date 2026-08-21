"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-dark text-cream border-b border-[#3a332a]">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-7 h-[60px] md:h-[66px] flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-cream hover:text-cream">
          <span className="font-bakbak text-[18px] md:text-[23px] tracking-[.01em]">BOTTLEMOODI</span>
          <span
            id="bm-top-slot"
            className="w-10 h-10 md:w-[52px] md:h-[52px] flex-none block"
            aria-hidden="true"
          />
        </Link>

        {/* Story link */}
        <a
          href="#story"
          className="font-bakbak text-[12px] md:text-[13px] tracking-[.1em] text-[#c4b79c] hover:text-cream transition-colors"
        >
          OUR STORY
        </a>
      </div>
    </header>
  );
}
