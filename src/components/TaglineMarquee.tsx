"use client";

/**
 * The red tagline band, running as a seamless ticker.
 *
 * The loop works by translating the track to -50% and repeating: the track
 * holds two identical halves, so the moment the first scrolls out the second
 * sits exactly where it started and the reset is invisible. Each half carries
 * enough copies to overflow a wide viewport, otherwise a gap would open on
 * large screens.
 */

const COPIES_PER_HALF = 6;

export function TaglineMarquee({ text }: { text: string }) {
  const half = (
    <div className="flex shrink-0">
      {Array.from({ length: COPIES_PER_HALF }, (_, i) => (
        <span key={i} className="flex items-center shrink-0">
          <span
            className="font-bakbak tracking-[.01em] whitespace-nowrap"
            style={{ fontSize: "clamp(18px,3.4vw,42px)" }}
          >
            {text}
          </span>
          {/* Separator between repetitions */}
          <span
            aria-hidden="true"
            className="rounded-full shrink-0 bg-cream/55"
            style={{
              width: "clamp(5px,.6vw,8px)",
              height: "clamp(5px,.6vw,8px)",
              margin: "0 clamp(18px,3vw,46px)",
            }}
          />
        </span>
      ))}
    </div>
  );

  return (
    <div className="bm-marquee bg-[#e8452c] text-cream border-y border-dark py-5 md:py-6 overflow-hidden">
      {/* The visible text is duplicated for the seamless loop, so expose it to
          assistive tech exactly once. */}
      <span className="sr-only">{text}</span>
      <div className="bm-marquee-track flex w-max" aria-hidden="true">
        {half}
        {half}
      </div>
    </div>
  );
}
