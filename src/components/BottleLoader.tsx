"use client";

import { CapDisc } from "@/components/CapDisc";
import { cn } from "@/lib/utils";

interface BottleLoaderProps {
  /** Diameter of the spinning cap in px. */
  size?: number;
  /** Text under the cap. Pass null for a bare cap. */
  label?: string | null;
  /** Vertical padding around the loader. Use "page" for full-section loads. */
  variant?: "inline" | "page";
  /** Render label light, for use on the dark storefront sections. */
  dark?: boolean;
  className?: string;
}

/**
 * The house loading indicator: the bottle cap, spinning.
 * Use this anywhere a fetch or a server render can leave the surface empty —
 * a blank region reads as "nothing here", which is the wrong message while
 * data is still on its way.
 */
export function BottleLoader({
  size = 56,
  label = "Loading",
  variant = "inline",
  dark = false,
  className,
}: BottleLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        variant === "page" ? "py-20 md:py-28" : "py-10",
        className
      )}
    >
      <CapDisc size={size} spinning />
      {label && (
        <span
          className={cn(
            "font-mono text-[11px] tracking-[.18em] uppercase",
            dark ? "text-[#c4b79c]" : "text-[#6e6455]"
          )}
        >
          {label}
        </span>
      )}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

/**
 * Placeholder card matching ProductCard's footprint, so a loading grid keeps
 * the same rhythm as the loaded one instead of collapsing and reflowing.
 */
export function ProductCardSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden="true">
      <div
        className={cn(
          "w-full animate-pulse",
          dark ? "bg-[#2a251e]" : "bg-[#e6ddc9]"
        )}
        style={{ aspectRatio: "4/5" }}
      />
      <div
        className={cn(
          "mt-3 h-3 w-3/4 animate-pulse",
          dark ? "bg-[#2a251e]" : "bg-[#e6ddc9]"
        )}
      />
      <div
        className={cn(
          "mt-2 h-3 w-1/3 animate-pulse",
          dark ? "bg-[#2a251e]" : "bg-[#e6ddc9]"
        )}
      />
    </div>
  );
}
