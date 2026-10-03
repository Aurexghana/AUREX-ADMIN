import { TONE_COLOR, type BadgeTone } from "./StatusBadge";

/**
 * Table-row status readout - a glowing dot plus colored text, no pill
 * background. Per feedback with a reference screenshot (an employee
 * table using exactly this convention in its status columns): tables
 * read this way now instead of the filled StatusBadge pill, which stays
 * in place everywhere else (detail-view headers, mobile card titles) -
 * this is specifically the table's own in-row status readout.
 *
 * Same four tones as StatusBadge (see TONE_COLOR there) - this brand's
 * gold plus its established green/red pair, not the reference's own
 * teal/orange, which aren't part of this app's palette.
 */
export default function StatusDot({ label, tone }: { label: string; tone: BadgeTone }) {
  const color = TONE_COLOR[tone];
  return (
    <span className="inline-flex items-center gap-2 font-sans text-sm font-medium" style={{ color }}>
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}` }} />
      {label}
    </span>
  );
}
