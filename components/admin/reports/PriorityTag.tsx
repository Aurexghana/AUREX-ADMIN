import { FlagIcon } from "@/components/icons";
import { TONE_COLOR, type BadgeTone } from "@/components/admin/StatusBadge";

/**
 * Priority readout for the Reports table/cards - same "colored text, no
 * pill background" idea as StatusDot (see that component's own note on
 * why tables use this plain in-row style rather than StatusBadge's
 * filled pill), but with a flag instead of a dot: priority isn't a
 * status, and a flag reads as "severity" in a way a status dot wouldn't.
 * Reuses the exact same four tones as every other status mapping in this
 * app rather than inventing new colors - see each Reports view's own
 * PRIORITY_TONE map for which tone means what here.
 */
export default function PriorityTag({ label, tone }: { label: string; tone: BadgeTone }) {
  const color = TONE_COLOR[tone];
  return (
    <span className="inline-flex items-center gap-1.5 font-sans text-sm font-medium" style={{ color }}>
      <FlagIcon className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}
