"use client";

import { useEffect, useLayoutEffect, useRef, useCallback } from "react";

interface AnimatedCapProps {
  heroSlotId: string;
  headerSlotId: string;
}

export function AnimatedCap({ heroSlotId, headerSlotId }: AnimatedCapProps) {
  const capRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    const cap = capRef.current;
    const top = document.getElementById(headerSlotId);
    if (!cap || !top) return;

    const tr = top.getBoundingClientRect();
    const tx = tr.left + tr.width / 2;
    const ty = tr.top + tr.height / 2;
    const ts = tr.width || 52;

    const hero = document.getElementById(heroSlotId);
    const hr = hero?.getBoundingClientRect();

    let x = tx, y = ty, size = ts, t = 1;

    if (hr && hr.width) {
      const scrollY = window.scrollY;
      // Document-space position of the hero slot centre — stable across layout shifts
      const heroDocCenterY = hr.top + scrollY + hr.height / 2;
      // Scroll distance at which the hero centre reaches the header centre
      const transitionRange = Math.max(1, heroDocCenterY - ty);
      t = Math.min(1, Math.max(0, scrollY / transitionRange));

      const lerp = (a: number, b: number) => a + (b - a) * t;
      x = lerp(hr.left + hr.width / 2, tx);
      y = lerp(hr.top + hr.height / 2, ty);
      size = lerp(hr.width, ts);
    }

    cap.style.left = x.toFixed(1) + "px";
    cap.style.top = y.toFixed(1) + "px";
    cap.style.width = cap.style.height = size.toFixed(1) + "px";
    cap.style.transform = `translate(-50%,-50%) rotate(${(-7 + 367 * t).toFixed(1)}deg)`;
    cap.style.opacity = "1";

    if (txtRef.current) {
      txtRef.current.style.fontSize = Math.max(8, size * 0.17).toFixed(1) + "px";
    }
  }, [heroSlotId, headerSlotId]);

  const loop = useCallback(() => {
    tick();
    rafRef.current = requestAnimationFrame(loop);
  }, [tick]);

  // Position correctly before the browser's first paint — prevents the flash
  // of the hardcoded fallback position on any viewport size.
  useLayoutEffect(() => {
    tick();
  }, [tick]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener("scroll", tick, { passive: true, capture: true });
    window.addEventListener("resize", tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", tick, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", tick);
    };
  }, [loop, tick]);

  return (
    <div
      ref={capRef}
      className="fixed z-[45] rounded-full flex items-center justify-center"
      style={{
        left: "50%",
        top: 280,
        width: 200,
        height: 200,
        opacity: 0,
        background: "repeating-conic-gradient(from 0deg, #e8452c 0 4.2deg, #a82d19 4.2deg 8.4deg)",
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,.28)",
        transform: "translate(-50%,-50%) rotate(-7deg)",
        willChange: "transform, top, left, width",
      }}
    >
      <div
        className="rounded-full flex items-center justify-center text-center"
        style={{
          width: "76%",
          height: "76%",
          background: "#e8452c",
          boxShadow: "inset 0 0 0 2px rgba(244,236,220,.5)",
          padding: "7%",
        }}
      >
        <span
          ref={txtRef}
          className="font-anek font-bold text-cream"
          style={{ lineHeight: 1.12, fontSize: 34 }}
        >
          பாட்டில்
          <br />
          மூடி
        </span>
      </div>
    </div>
  );
}
