"use client";

import { useState } from "react";
import { formatGhs } from "@/lib/formatters";
import type { PackageAllocation } from "@/lib/investments";

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER_R = 90;
const INNER_R = 54;
const GAP_DEG = 3; // angular surface gap between the two slices

type Slice = { key: "core" | "ventures"; label: string; value: number; colorClassName: string };

// Fixed identity, not by current magnitude: "color follows the entity,
// never its rank" (dataviz skill) - if Ventures ever overtakes Core's
// share, these two colors must NOT swap, or a filter/time-range change
// would repaint the survivors. Core (the flagship product, always named
// first in lib/investmentSlots.ts's own SLOT_PACKAGE_LABEL) keeps the
// brand's one real accent; Ventures - no second brand hue exists to
// validate - takes the neutral, same "emphasis" treatment as the
// Members-by-Track chart beside it.
const SLICE_ORDER: Omit<Slice, "value">[] = [
  { key: "core", label: "AUREX Core", colorClassName: "fill-gold-deep" },
  { key: "ventures", label: "AUREX Ventures", colorClassName: "fill-cream-dim" },
];

function polarToCartesian(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  // Rounded to 3dp: Math.cos/sin can return a last-bit-different float
  // between the server's and the client's JS engine for the exact same
  // input, which - left at full precision - turns into a genuine SSR/
  // client hydration mismatch on this path's `d` attribute (observed:
  // 184.06491820341776 vs 184.0649182034178). Rounding before
  // stringifying normalizes both sides to the same text.
  return {
    x: Math.round((CENTER + r * Math.cos(rad)) * 1000) / 1000,
    y: Math.round((CENTER + r * Math.sin(rad)) * 1000) / 1000,
  };
}

function donutSlicePath(startAngle: number, endAngle: number) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(startAngle, OUTER_R);
  const outerEnd = polarToCartesian(endAngle, OUTER_R);
  const innerStart = polarToCartesian(endAngle, INNER_R);
  const innerEnd = polarToCartesian(startAngle, INNER_R);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

/**
 * "Investment allocation by package type - AUREX Core vs. AUREX
 * Ventures, as a share of total amount invested." Two categories, so
 * per the dataviz skill's own guidance the default form would be a
 * proportion bar (same as the two SegmentedBar charts elsewhere on this
 * page), not a pie - requested as a pie chart specifically here, so
 * this is a donut (a pie chart's own inner-radius variant).
 *
 * Per feedback: no in-chart/paragraph text at all - the card's own
 * heading is left to say what this is, so both the center-hole label
 * (total/hovered figure) and the card's description paragraph (in
 * OverviewView) are dropped. The legend sits below the donut, one line
 * per slice (dot, label, percent only - the GHS figure moved to a
 * `title` tooltip rather than sitting in the row) so both entries stay
 * short enough to sit side by side even in this card's own narrower
 * grid column, rather than wrapping to a vertical stack. Same fixed-
 * identity colors and hover rigor as the other charts on this page
 * regardless of the shape; the SVG keeps its own aria-label so the
 * numbers stay reachable for screen readers even with no visible
 * on-chart text.
 */
export default function PackagePieChart({ allocation }: { allocation: PackageAllocation }) {
  const [hoverKey, setHoverKey] = useState<Slice["key"] | null>(null);
  const total = allocation.core + allocation.ventures;

  const slices: Slice[] = SLICE_ORDER.map((s) => ({ ...s, value: allocation[s.key] }));

  const drawn = slices
    .filter((s) => s.value > 0)
    .reduce<Array<Slice & { start: number; end: number; percent: number }>>((acc, s) => {
      const cursor = acc.length > 0 ? acc[acc.length - 1].end + GAP_DEG : 0;
      const sweep = total > 0 ? (s.value / total) * 360 : 0;
      const start = cursor;
      const end = cursor + sweep - GAP_DEG;
      acc.push({ ...s, start, end, percent: total > 0 ? Math.round((s.value / total) * 100) : 0 });
      return acc;
    }, []);

  // With nothing invested yet, `drawn` above comes back empty - an
  // invisible donut (no <path>s at all) and an equally empty legend row,
  // which reads as broken, not "zero". Same reasoning as TrendChart's own
  // `data.length === 0` fallback right beside this card.
  if (total === 0) {
    return <p className="font-sans text-sm text-cream-dim">No investment data yet.</p>;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="size-full"
          role="img"
          aria-label={`Investment allocation by package: AUREX Core ${formatGhs(allocation.core)}, AUREX Ventures ${formatGhs(allocation.ventures)}, of ${formatGhs(total)} total invested`}
        >
          {drawn.map((slice) => (
            <path
              key={slice.key}
              d={donutSlicePath(slice.start, slice.end)}
              className={`${slice.colorClassName} transition-opacity`}
              opacity={hoverKey && hoverKey !== slice.key ? 0.55 : 1}
              stroke="var(--color-panel)"
              strokeWidth={hoverKey === slice.key ? 3 : 1}
              onPointerEnter={() => setHoverKey(slice.key)}
              onPointerLeave={() => setHoverKey(null)}
              tabIndex={0}
              onFocus={() => setHoverKey(slice.key)}
              onBlur={() => setHoverKey(null)}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {drawn.map((slice) => (
          <div
            key={slice.key}
            title={formatGhs(slice.value)}
            onPointerEnter={() => setHoverKey(slice.key)}
            onPointerLeave={() => setHoverKey(null)}
            className="flex items-center gap-1.5 whitespace-nowrap font-sans text-sm text-cream-dim"
          >
            <span className={`size-2.5 shrink-0 rounded-sm ${slice.colorClassName.replace("fill-", "bg-")}`} />
            <span className="text-cream">{slice.label}</span>
            <span className="font-jakarta font-semibold text-cream">{slice.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
