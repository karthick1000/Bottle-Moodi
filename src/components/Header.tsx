"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useCartStore } from "@/lib/store";

function UserNav() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const firstName = user?.firstName ?? "";
  const displayName = firstName || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 500 }}>
      <span
        className="font-bakbak flex-none flex items-center justify-center"
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#e8452c",
          color: "#f4ecdc",
          fontSize: 12,
        }}
      >
        {initial}
      </span>
      <span className="hidden lg:inline text-cream">{displayName}</span>
      <button
        onClick={() => signOut()}
        className="cursor-pointer border-0 bg-transparent transition-colors"
        style={{ color: "#6e6455", fontSize: 12 }}
      >
        Logout
      </button>
    </div>
  );
}

export function Header() {
  const { isSignedIn } = useAuth();
  const { items, toggleCart, openLogin, openSignup } = useCartStore();
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

          {/* Desktop right side: nav + auth + cart */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            <nav className="flex items-center gap-5 lg:gap-6">
              <Link href="/shop" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium transition-colors">
                Kadai / Shop
              </Link>
              <Link href="/#story" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium transition-colors">
                Story
              </Link>
              <Link href="/#soon" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium transition-colors">
                Coming soon
              </Link>
              {isSignedIn && (
                <Link href="/my-orders" className="text-cream hover:text-[#e8452c] text-[13.5px] font-medium transition-colors">
                  My Orders
                </Link>
              )}
            </nav>

            {/* Auth */}
            {!isSignedIn ? (
              <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 500 }}>
                <button
                  onClick={openLogin}
                  className="cursor-pointer border-0 bg-transparent text-cream hover:text-[#e8452c] transition-colors"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  Login
                </button>
                <span style={{ color: "#5a6a61" }}>/</span>
                <button
                  onClick={openSignup}
                  className="cursor-pointer border-0 bg-transparent hover:underline"
                  style={{ color: "#e8452c", fontSize: 13, fontWeight: 500 }}
                >
                  Sign up
                </button>
              </div>
            ) : (
              <UserNav />
            )}

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="cursor-pointer border-[1.5px] border-[#e8452c] bg-transparent text-[#e8452c] font-inter text-[12px] md:text-[12.5px] font-semibold px-3 md:px-[15px] py-2 rounded-sm tracking-[.04em] hover:bg-[#e8452c] hover:text-cream transition-colors min-h-[40px]"
            >
              BAG ({items.length})
            </button>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleCart}
              className="cursor-pointer border-[1.5px] border-[#e8452c] bg-transparent text-[#e8452c] font-inter text-[12px] font-semibold px-3 py-2 rounded-sm tracking-[.04em] hover:bg-[#e8452c] hover:text-cream transition-colors min-h-[40px]"
            >
              BAG ({items.length})
            </button>
            <button
              className="flex flex-col justify-center items-center gap-[5px] w-10 h-10 cursor-pointer border-none bg-transparent"
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
              ...(isSignedIn ? [{ href: "/my-orders", label: "My Orders" }] : []),
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
          <div className="px-6 flex items-center gap-3 pb-2">
            {!isSignedIn ? (
              <>
                <button
                  onClick={() => { close(); openLogin(); }}
                  className="font-inter text-[15px] font-medium text-cream cursor-pointer border-0 bg-transparent"
                >
                  Login
                </button>
                <span style={{ color: "#5a6a61" }}>/</span>
                <button
                  onClick={() => { close(); openSignup(); }}
                  className="font-inter text-[15px] font-medium cursor-pointer border-0 bg-transparent"
                  style={{ color: "#e8452c" }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <MobileSignOut />
            )}
          </div>
          <div className="px-6 mt-auto pb-10 font-anek text-[15px] text-[#e8452c]">
            Mood-க்கு ஏத்த Design
          </div>
        </div>
      )}
    </>
  );
}

function MobileSignOut() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut()}
      className="font-inter text-[15px] font-medium text-cream cursor-pointer border-0 bg-transparent"
    >
      Sign out
    </button>
  );
}
