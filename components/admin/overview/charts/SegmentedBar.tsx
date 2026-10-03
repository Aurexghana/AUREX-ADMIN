"use client";

import { useState } from "react";

export type BarSegment = {
  key: string;
  label: string;
  value: number;
  /** Tailwind fill class, e.g. "fill-gold-deep" is intentionally NOT used
   *  here - this is a plain HTML div bar, not SVG, so these are bg-*
   *  classes. Kept as a prop (not hardcoded) so each caller supplies its
   *  own already-established color per the brief's "don't invent new
   *  colors" rule - see SegmentedBar's two call sites for which existing
   *  token/accent each status or track maps to. */
  colorClassName: string;
};

/**
 * A part-to-whole proportion bar - used for both "Applications by
 * Status" (a genuine status breakdown: pending/approved/rejected, so it
 * wears this brand's existing status colors, not invented categorical
 * hues) and "Members by Track" (investor vs business owner: since this
 * brand has only one real hue family, that split is drawn as *emphasis*
 * - one accent + one neutral - rather than pretending two invented hues
 * are a validated categorical pair).
 *
 * A 2px surface gap separates segments (per the dataviz skill's mark
 * spec) rather than a border between them; the whole bar gets a hairline
 * outer border instead, since in light mode none of this brand's accent
 * fills clear the 3:1 mark-contrast floor against a near-white surface -
 * the border keeps the bar's shape legible regardless, and the legend's
 * always-visible counts (not hover-only) are the mandatory secondary
 * encoding that check requires.
 */
export default function SegmentedBar({ segments, ariaLabel }: { segments: BarSegment[]; ariaLabel: string }) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex h-3.5 w-full gap-[2px] border border-grid-line"
      >
        {segments
          .filter((s) => s.value > 0)
          .map((segment) => {
            const percent = total > 0 ? (segment.value / total) * 100 : 0;
            return (
              <div
                key={segment.key}
                className={`relative flex items-center justify-center transition-opacity ${segment.colorClassName} ${
                  hoverKey && hoverKey !== segment.key ? "opacity-60" : ""
                }`}
                style={{ flex: `${percent} 0 0%` }}
                onPointerEnter={() => setHoverKey(segment.key)}
                onPointerLeave={() => setHoverKey(null)}
                tabIndex={0}
                onFocus={() => setHoverKey(segment.key)}
                onBlur={() => setHoverKey(null)}
              >
                {hoverKey === segment.key && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 flex flex-col items-center gap-0.5 whitespace-nowrap border border-gold/20 bg-panel px-2.5 py-1.5 shadow-lg">
                    <span className="font-jakarta text-sm font-semibold text-cream">{segment.value}</span>
                    <span className="font-sans text-xs text-cream-dim">
                      {segment.label} · {Math.round(percent)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Legend - always visible, never hover-only, so every value here
          is reachable without the tooltip above. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <span key={segment.key} className="flex items-center gap-2 font-sans text-sm text-cream-dim">
            <span className={`size-2.5 shrink-0 rounded-sm ${segment.colorClassName}`} />
            {segment.label} <span className="font-jakarta font-semibold text-cream">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
