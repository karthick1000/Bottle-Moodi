"use client";

import { useEffect, useState } from "react";

export function IntroLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-dark flex flex-col items-center justify-center gap-8"
      style={{ animation: "bm-fade 2.3s ease forwards" }}
    >
      {/* bottle */}
      <div className="relative" style={{ width: 100, height: 224 }}>
        {/* cap */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 32,
            height: 15,
            background: "#e8452c",
            borderRadius: "3px 3px 2px 2px",
            animation: "bm-pop 2.3s cubic-bezier(.3,-.4,.3,1.6) forwards",
          }}
        />
        {/* bottle body */}
        <div
          className="bottle-clip absolute"
          style={{ left: "50%", transform: "translateX(-50%)", top: 20, width: 96, height: 200, background: "#f4ecdc" }}
        >
          <div
            className="bottle-clip absolute flex items-end"
            style={{ inset: 3, background: "#1a1713" }}
          >
            <div
              style={{ width: "100%", background: "#e8452c", animation: "bm-fill 2.3s ease-in-out forwards" }}
            />
          </div>
        </div>
      </div>
      <div className="font-bakbak text-cream tracking-[.34em] text-[15px]">BOTTLEMOODI</div>
    </div>
  );
}
