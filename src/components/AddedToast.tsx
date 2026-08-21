"use client";

import { useEffect, useState } from "react";

interface AddedToastProps {
  label: string;
  onDone: () => void;
}

export function AddedToast({ label, onDone }: AddedToastProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      onDone();
    }, 2300);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!show) return null;

  return (
    <div
      className="fixed left-6 bottom-6 z-[120] bg-dark text-cream border border-[#e8452c] px-5 py-4 flex items-center gap-4"
      style={{ animation: "bm-toast 1.9s ease forwards" }}
    >
      {/* mini bottle */}
      <div className="relative" style={{ width: 30, height: 56 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 11,
            height: 5,
            background: "#e8452c",
            borderRadius: 2,
            animation: "bm-pop 1.9s ease-out forwards",
          }}
        />
        <div
          className="bottle-clip absolute"
          style={{ left: "50%", transform: "translateX(-50%)", top: 7, width: 30, height: 49, background: "#f4ecdc" }}
        >
          <div
            className="bottle-clip absolute flex items-end"
            style={{ inset: 1.5, background: "#1a1713" }}
          >
            <div style={{ width: "100%", background: "#e8452c", animation: "bm-fill 1.9s ease forwards" }} />
          </div>
        </div>
      </div>
      <div>
        <div className="font-bakbak text-[14px] tracking-[.04em]">ADDED TO BAG</div>
        <div className="text-[12.5px] text-[#8d8371] mt-0.5">{label}</div>
      </div>
    </div>
  );
}
