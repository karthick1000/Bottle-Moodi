"use client";

import Link from "next/link";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useCartStore } from "@/lib/store";

export function Header() {
  const { items, toggleCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark text-cream border-b border-[#3a332a]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-7 h-[60px] md:h-[66px] flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-cream hover:text-cream" onClick={close}>
            <span className="font-bakbak text-[18px] md:text-[23px] tracking-[.01em]">BOTTLEMOODI</span>
            <span
              id="bm-top-slot"
              className="w-10 h-10 md:w-[52px] md:h-[52px] flex-none block"
              aria-hidden="true"
            />
          </Link>

          <div className="flex items-center gap-3">
            {/* Auth — signed out: sign in link; signed in: user avatar */}
            <SignedOut>
              <SignInButton mode="redirect">
                <button className="hidden md:block cursor-pointer border-0 bg-transparent text-[#c4b79c] hover:text-[#e8452c] text-[13px] font-medium transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-sm",
                    userButtonPopoverCard: "rounded-sm shadow-lg",
                  },
                  variables: {
                    colorPrimary: "#e8452c",
                    borderRadius: "2px",
                  },
                }}
              />
            </SignedIn>

            {/* Cart button — always visible */}
            <button
              onClick={toggleCart}
              className="cursor-pointer border-[1.5px] border-[#e8452c] bg-transparent text-[#e8452c] font-inter text-[12px] md:text-[12.5px] font-semibold px-3 md:px-[15px] py-2 md:py-2 rounded-sm tracking-[.04em] hover:bg-[#e8452c] hover:text-cream transition-colors min-h-[40px]"
            >
              BAG ({items.length})
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col justify-center items-center gap-[5px] w-10 h-10 cursor-pointer border-none bg-transparent"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span
                className="block w-6 h-[1.5px] bg-cream transition-transform duration-200"
                style={menuOpen ? { transform: "rotate(45deg) translate(4.5px,4.5px)" } : {}}
              />
              <span
                className="block w-6 h-[1.5px] bg-cream transition-opacity duration-200"
                style={menuOpen ? { opacity: 0 } : {}}
              />
              <span
                className="block w-6 h-[1.5px] bg-cream transition-transform duration-200"
                style={menuOpen ? { transform: "rotate(-45deg) translate(4.5px,-4.5px)" } : {}}
              />
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/shop" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium">
                Kadai / Shop
              </Link>
              <Link href="/#story" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium">
                Story
              </Link>
              <Link href="/#soon" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium">
                Coming soon
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-[60px] flex flex-col" style={{ background: "#1a1713" }}>
          <nav className="flex flex-col px-6 py-8 gap-1">
            {[
              { href: "/shop", label: "Kadai / Shop" },
              { href: "/#story", label: "Story" },
              { href: "/#soon", label: "Coming soon" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="font-bakbak text-[28px] text-cream border-b border-[#3a332a] py-5 hover:text-[#e8452c] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-6 mt-auto pb-10 font-anek text-[15px] text-[#e8452c]">
            Mood-க்கு ஏத்த Design
          </div>
        </div>
      )}
    </>
  );
}
