import { cn } from "@/lib/utils";

/**
 * A 35mm film strip, used to separate homepage sections.
 *
 * The sections are already labelled REEL 01 / 02 / 03, so the divider makes
 * that literal: a dark section sitting between two of these reads as a frame
 * of film. Perforations come from a repeating gradient rather than DOM nodes,
 * so the strip costs two pseudo-elements at any width.
 *
 * The bottle cap breaks the gate at every boundary — the same mark each time,
 * so three dividers read as one system rather than three decorations. The
 * reel wording stays with each section's heading, where it belongs.
 */
export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("bm-film", className)} role="presentation" aria-hidden="true">
      <div className="bm-film-line" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="cap-gradient rounded-full flex items-center justify-center"
          style={{ width: 26, height: 26, boxShadow: "0 0 0 5px #1a1713" }}
        >
          <span
            className="rounded-full"
            style={{
              width: "58%",
              height: "58%",
              background: "#e8452c",
              boxShadow: "inset 0 0 0 1px rgba(244,236,220,.55)",
            }}
          />
        </span>
      </div>
    </div>
  );
}
