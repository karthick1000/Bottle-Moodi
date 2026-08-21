"use client";

import { cn } from "@/lib/utils";

interface CapDiscProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  textSize?: number;
  spinning?: boolean;
}

export function CapDisc({ size = 200, className, style, textSize, spinning = false }: CapDiscProps) {
  const inner = Math.round(size * 0.76);
  const fs = textSize ?? Math.round(size * 0.17);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "repeating-conic-gradient(from 0deg, #e8452c 0 4.2deg, #a82d19 4.2deg 8.4deg)",
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,.28)",
        ...style,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: "50%",
          background: "#e8452c",
          boxShadow: "inset 0 0 0 2px rgba(244,236,220,.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "7%",
          ...(spinning ? { animation: "bm-spin 7s linear infinite" } : {}),
        }}
      >
        <span
          className="font-anek font-bold text-cream leading-tight"
          style={{ fontSize: fs }}
        >
          பாட்டில்
          <br />
          மூடி
        </span>
      </div>
    </div>
  );
}
