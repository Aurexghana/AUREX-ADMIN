import type { ReactNode } from "react";
import { CheckIcon, ClockIcon, XIcon } from "@/components/icons";

// Generic status pill. Each domain (applications/members/slots/listings)
// maps its own status enum to one of these four tones rather than this
// component knowing about every possible status string - see each
// view's own STATUS_TONE map.
export type BadgeTone = "neutral" | "gold" | "success" | "danger";

// Filled pastel chip: a tinted background plus a saturated icon/text in
// the same hue, per feedback asking every tag in the app to read this
// way instead of the old bordered-outline pill. "danger" reuses #f87171
// and "success" reuses #4ade80 - not new colors: the same red/green
// pair this repo's own SegmentedBar already uses for
// rejected/approved, just applied to a pill instead of a bar segment.
const TONE_CLASSNAME: Record<BadgeTone, string> = {
  neutral: "bg-cream-dim/15 text-cream-dim",
  gold: "bg-gold/15 text-gold-bright",
  success: "bg-[#4ade80]/15 text-[#4ade80]",
  danger: "bg-[#f87171]/15 text-[#f87171]",
};

// One icon per tone (not per status label) - same "tone, not string"
// boundary as TONE_CLASSNAME: neutral reads as "waiting", gold/success
// both read as "affirmative" (gold = currently active, success = fully
// resolved), danger reads as "stopped/rejected".
const TONE_ICON: Record<BadgeTone, ReactNode> = {
  neutral: <ClockIcon className="size-3" />,
  gold: <CheckIcon className="size-3" />,
  success: <CheckIcon className="size-3" />,
  danger: <XIcon className="size-3" />,
};

// The same four hues as raw CSS color values (not Tailwind classes) -
// shared with StatusDot, the dot-plus-text table variant of this same
// tone system, since a dot's fill/glow needs a real color to put in an
// inline style.
export const TONE_COLOR: Record<BadgeTone, string> = {
  neutral: "var(--color-cream-dim)",
  gold: "var(--color-gold-bright)",
  success: "#4ade80",
  danger: "#f87171",
};

export default function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-jakarta text-xs font-medium ${TONE_CLASSNAME[tone]}`}
    >
      {TONE_ICON[tone]}
      {label}
    </span>
  );
}
