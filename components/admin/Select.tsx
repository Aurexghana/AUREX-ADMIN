"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";

export type SelectOption = { value: string; label: string };

/**
 * A custom-built dropdown, replacing the plain HTML <select> used
 * throughout this admin. Per feedback with a reference screenshot: a
 * native <select>'s own option list is OS-drawn chrome this app can't
 * restyle - Chromium on Windows ignores author CSS on <option> almost
 * entirely, always painting its own blue hover highlight, which is
 * exactly the "hovering is blue, it should match our colors" symptom.
 * Matching the reference's tinted hover pill meant building the list
 * ourselves rather than trying to theme the native one - its rounded
 * corners are NOT carried over per feedback, though: this app's panel
 * and option rows stay square, same as its cards/borders everywhere
 * else.
 */
export default function Select({
  value,
  onChange,
  options,
  ariaLabel,
  triggerClassName = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream transition-colors focus:border-gold/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDownIcon className={`size-2.5 shrink-0 text-cream-dim transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-20 mt-2 min-w-full max-w-[calc(100vw-2rem)] border border-gold/20 bg-panel p-1.5 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-sans text-sm transition-colors hover:bg-gold/10 hover:text-gold-bright ${
                    isSelected ? "text-gold-bright" : "text-cream"
                  }`}
                >
                  <span className="whitespace-nowrap">{option.label}</span>
                  {isSelected && <CheckIcon className="size-3 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
