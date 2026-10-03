"use client";

import { useMemo, useState } from "react";
import { formatGhs } from "@/lib/formatters";
import type { MonthlyInvestedPoint } from "@/lib/investments";

// Fixed viewBox the SVG scales fluidly from (width:100%, aspect-ratio
// locked via the wrapper's own style) - lets pointer math stay in one
// coordinate space regardless of the rendered size.
const VB_WIDTH = 640;
const VB_HEIGHT = 260;
const PAD = { top: 24, right: 16, bottom: 28, left: 56 };

/**
 * A single-series cumulative trend line - per dataviz guidance, a trend-
 * over-time job takes one hue (gold-deep, the deepest/most-saturated
 * shade in the brand's one hue family) rather than a rainbow.
 *
 * Interaction follows the skill's own spec: a crosshair tracks the
 * pointer and snaps to the nearest month; the tooltip's value is the
 * strong element, the month secondary. The exact monthly figures are
 * also reachable without hovering at all via the "Show data" table
 * toggle underneath - tooltips enhance, they never gate.
 *
 * Light-mode note: gold-deep only reaches ~2.6:1 against this brand's
 * near-white light surface (measured with the skill's own contrast()
 * checker) - below the 3:1 mark floor, and there's no deeper gold shade
 * available: a darker light-mode-only gold override was tried and
 * reverted per feedback (it read as brown, not gold - see
 * app/globals.css's own comment), so this is the brand's one gold,
 * unchanged across both themes. Per the skill's documented mitigation
 * for exactly this case (a WARN is legal only with a secondary
 * encoding, never dismissed outright), every value here is also carried
 * by direct text labels (the endpoint figure, the axis ticks, the
 * tooltip, the data table) in the theme-flipping cream/cream-dim text
 * tokens, which contrast comfortably in both modes - so the line's
 * shape is a visual aid, never the only carrier of the number.
 */
export default function TrendChart({ data }: { data: MonthlyInvestedPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { points, yTicks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.cumulativeGhs)) * 1.15;
    const chartWidth = VB_WIDTH - PAD.left - PAD.right;
    const chartHeight = VB_HEIGHT - PAD.top - PAD.bottom;
    const pts = data.map((d, i) => ({
      ...d,
      x: PAD.left + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth),
      y: PAD.top + chartHeight - (d.cumulativeGhs / max) * chartHeight,
    }));
    const ticks = [0, 0.5, 1].map((f) => ({
      value: max * f,
      y: PAD.top + chartHeight - f * chartHeight,
    }));
    return { points: pts, yTicks: ticks };
  }, [data]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${VB_HEIGHT - PAD.bottom} L ${points[0]?.x ?? 0} ${VB_HEIGHT - PAD.bottom} Z`;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * VB_WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;
  const last = points[points.length - 1];

  if (data.length === 0) {
    return <p className="font-sans text-sm text-cream-dim">No investment activity recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full" style={{ aspectRatio: `${VB_WIDTH} / ${VB_HEIGHT}` }}>
        <svg
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          className="absolute inset-0 size-full overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          role="img"
          aria-label={`Cumulative amount invested by month, from ${data[0].label} to ${data[data.length - 1].label}, ending at ${formatGhs(data[data.length - 1].cumulativeGhs)}`}
        >
          {/* gridlines - hairline, recessive, one step off the surface */}
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line x1={PAD.left} x2={VB_WIDTH - PAD.right} y1={tick.y} y2={tick.y} stroke="var(--color-grid-line)" strokeWidth={1} />
              <text x={PAD.left - 8} y={tick.y} textAnchor="end" dominantBaseline="middle" className="fill-cream-dim text-[10px]">
                {formatGhs(tick.value)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {points.map((p) => (
            <text key={p.label} x={p.x} y={VB_HEIGHT - 8} textAnchor="middle" className="fill-cream-dim text-[10px]">
              {p.label}
            </text>
          ))}

          {/* area wash - a wash under the line, never a saturated block */}
          <path d={areaPath} className="fill-gold-deep" opacity={0.1} />

          {/* the line itself */}
          <path d={linePath} fill="none" className="stroke-gold-deep" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* end-dots, each with a 2px surface ring so they stay legible crossing the line */}
          {points.map((p, i) => (
            <circle
              key={p.label}
              cx={p.x}
              cy={p.y}
              r={i === hoverIndex ? 5.5 : 4}
              className="fill-gold-deep"
              stroke="var(--color-ink)"
              strokeWidth={2}
            />
          ))}

          {/* crosshair */}
          {hovered && (
            <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={VB_HEIGHT - PAD.bottom} className="stroke-gold-deep" strokeOpacity={0.35} strokeWidth={1} />
          )}

          {/* always-visible endpoint label - the headline figure, not
              gated behind hover */}
          {last && (
            <text x={last.x} y={last.y - 12} textAnchor="end" className="fill-cream text-xs font-semibold">
              {formatGhs(last.cumulativeGhs)}
            </text>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 flex -translate-x-1/2 flex-col gap-0.5 border border-gold/20 bg-panel px-2.5 py-1.5 shadow-lg"
            style={{
              left: `${(hovered.x / VB_WIDTH) * 100}%`,
              top: `${Math.max(0, (hovered.y / VB_HEIGHT) * 100 - 18)}%`,
            }}
          >
            <span className="font-jakarta text-sm font-semibold text-cream">{formatGhs(hovered.cumulativeGhs)}</span>
            <span className="font-sans text-xs text-cream-dim">{hovered.label}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="w-fit font-sans text-xs text-cream-dim underline-offset-4 transition-colors hover:text-gold-bright hover:underline"
      >
        {showTable ? "Hide data table" : "Show data table"}
      </button>

      {showTable && (
        <table className="w-full max-w-xs border-collapse text-left">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="py-1.5 pr-4 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Month</th>
              <th className="py-1.5 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-grid-line last:border-b-0">
                <td className="py-1.5 pr-4 font-sans text-sm text-cream-dim">{d.label}</td>
                <td className="py-1.5 font-jakarta text-sm text-cream">{formatGhs(d.cumulativeGhs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
