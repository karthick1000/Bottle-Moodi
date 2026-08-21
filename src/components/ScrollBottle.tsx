"use client";

import { useEffect, useRef } from "react";

export function ScrollBottle() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const se = document.scrollingElement || document.documentElement;
      const pct = Math.round(
        Math.min(1, se.scrollTop / Math.max(1, se.scrollHeight - window.innerHeight)) * 100
      );
      if (fillRef.current) fillRef.current.style.height = pct + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed right-4 bottom-6 z-30 pointer-events-none bottle-clip"
      style={{ width: 30, height: 66, background: "rgba(26,23,19,.45)" }}
    >
      <div
        className="bottle-clip absolute flex items-end"
        style={{ inset: 1.5, background: "rgba(244,236,220,.85)" }}
      >
        <div ref={fillRef} style={{ width: "100%", background: "#e8452c", height: "0%" }} />
      </div>
    </div>
  );
}
