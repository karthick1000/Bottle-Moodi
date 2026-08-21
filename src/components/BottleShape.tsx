"use client";

import { cn } from "@/lib/utils";

interface BottleShapeProps {
  width?: number;
  height?: number;
  fillPercent?: number;
  fillColor?: string;
  outerColor?: string;
  innerBg?: string;
  className?: string;
  animated?: boolean;
  loopAnimate?: boolean;
  capColor?: string;
  showCap?: boolean;
  capAnimated?: boolean;
}

export function BottleShape({
  width = 96,
  height = 200,
  fillPercent = 100,
  fillColor = "#e8452c",
  outerColor = "#f4ecdc",
  innerBg = "#1a1713",
  className,
  animated = false,
  loopAnimate = false,
  showCap = true,
  capAnimated = false,
}: BottleShapeProps) {
  const capW = Math.round(width * 0.33);
  const capH = Math.round(width * 0.15);

  return (
    <div
      className={cn("relative", className)}
      style={{ width, height: height + (showCap ? capH + 5 : 0) }}
    >
      {showCap && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0)",
            top: 0,
            width: capW,
            height: capH,
            background: fillColor,
            borderRadius: "3px 3px 2px 2px",
            ...(capAnimated ? { animation: "bm-pop 2.3s cubic-bezier(.3,-.4,.3,1.6) forwards" } : {}),
          }}
        />
      )}
      <div
        className="bottle-clip absolute"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          top: showCap ? capH + 5 : 0,
          width,
          height,
          background: outerColor,
        }}
      >
        <div
          className="bottle-clip absolute inset-[3px] flex items-end"
          style={{ background: innerBg }}
        >
          <div
            style={{
              width: "100%",
              background: fillColor,
              height: `${fillPercent}%`,
              ...(animated ? { animation: "bm-fill 2.3s ease-in-out forwards" } : {}),
              ...(loopAnimate ? { animation: "bm-loop 1.1s ease-in-out infinite" } : {}),
            }}
          />
        </div>
      </div>
    </div>
  );
}
