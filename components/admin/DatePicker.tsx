"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightIcon, CalendarIcon } from "@/components/icons";
import { formatDisplayDate } from "@/lib/formatters";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const POPUP_WIDTH_PX = 256; // w-64
const POPUP_HEIGHT_PX = 300; // header + weekday row + up to 6 week rows + padding
const VIEWPORT_MARGIN_PX = 8;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** Parses this component's own "YYYY-MM-DD" value directly, rather than
 *  via `new Date(iso)`, which reads it as UTC midnight and can shift a
 *  day backward once `.getDate()` etc. apply the browser's local zone. */
function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

/**
 * A custom-built date field, replacing the plain HTML <input type="date">
 * used across the Investment and Slot forms. Per feedback that the
 * dropdown fix should be consistent across the app: a native date
 * input's own calendar popup is the same class of problem as a native
 * <select>'s option list — OS-drawn chrome (Chromium on Windows always
 * paints its own blue "today"/hover highlight there too) that this
 * app's CSS can't reach — so this reuses Select's exact conventions
 * (trigger button, outside-click/Escape-to-close popup, square panel,
 * gold hover) rather than a different pattern for what is, underneath,
 * the same bug.
 */
export default function DatePicker({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = parseIsoDate(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.getMonth());

  // Portaled to document.body with viewport-clamped fixed coordinates, so
  // the popup can't be cut off by (or stretch the scroll area of) the
  // modal it's opened from, and stays on-screen at narrow widths. Flips
  // above the trigger when there's no room below. Recomputed every frame
  // while open because the modal is still animating in when this opens.
  const reposition = () => {
    const trigger = rootRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(POPUP_WIDTH_PX, window.innerWidth - VIEWPORT_MARGIN_PX * 2);
    const left = Math.max(VIEWPORT_MARGIN_PX, Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN_PX));
    // Real rendered height once mounted (falls back to an estimate on the
    // first frame), capped to the viewport — the popup scrolls internally
    // via max-height below if the window is shorter than the calendar.
    const maxHeight = window.innerHeight - VIEWPORT_MARGIN_PX * 2;
    const height = Math.min(popupRef.current?.offsetHeight ?? POPUP_HEIGHT_PX, maxHeight);
    const spaceBelow = window.innerHeight - VIEWPORT_MARGIN_PX - (rect.bottom + 8);
    const spaceAbove = rect.top - 8 - VIEWPORT_MARGIN_PX;
    let top: number;
    if (height <= spaceBelow) top = rect.bottom + 8;
    else if (height <= spaceAbove) top = rect.top - 8 - height;
    else top = window.innerHeight - VIEWPORT_MARGIN_PX - height; // neither side fits: pin to the bottom edge, fully visible
    setPosition((prev) =>
      prev && prev.top === top && prev.left === left && prev.width === width ? prev : { top, left, width },
    );
  };

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let frame = requestAnimationFrame(function tick() {
      reposition();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openPicker() {
    setViewYear(selected?.year ?? today.getFullYear());
    setViewMonth(selected?.month ?? today.getMonth());
    setOpen((o) => !o);
  }

  function changeMonth(delta: number) {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex w-full items-center justify-between gap-2 border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream transition-colors focus:border-gold/50 focus:outline-none"
      >
        <span className={value ? "" : "text-cream-dim/50"}>{value ? formatDisplayDate(value) : "Select a date"}</span>
        <CalendarIcon className="size-3.5 shrink-0 text-cream-dim" />
      </button>

      {open &&
        position &&
        createPortal(
        <div
          ref={popupRef}
          role="dialog"
          aria-label={ariaLabel}
          style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
          className="z-[110] max-h-[calc(100vh-1rem)] overflow-y-auto border border-gold/20 bg-panel p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="flex size-6 items-center justify-center text-cream-dim transition-colors hover:text-gold-bright"
            >
              <span className="rotate-180">
                <ArrowRightIcon className="size-2.5" />
              </span>
            </button>
            <span className="font-jakarta text-sm font-medium text-cream">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="flex size-6 items-center justify-center text-cream-dim transition-colors hover:text-gold-bright"
            >
              <ArrowRightIcon className="size-2.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1 font-sans text-[10px] uppercase tracking-wide text-cream-dim">
                {label}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const isSelected = selected?.year === viewYear && selected?.month === viewMonth && selected?.day === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(toIsoDate(viewYear, viewMonth, day));
                    setOpen(false);
                  }}
                  className={`py-1.5 font-sans text-xs transition-colors hover:bg-gold/10 hover:text-gold-bright ${
                    isSelected ? "bg-gold/15 text-gold-bright" : "text-cream"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
