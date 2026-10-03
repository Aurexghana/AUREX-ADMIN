"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@/components/icons";

export type ComboSelectOption = { value: string; label: string };

export default function ComboSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  ariaLabel,
  triggerClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

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

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function openDropdown() {
    setQuery("");
    setHighlightedIndex(0);
    setOpen(true);
  }

  function selectOption(option: ComboSelectOption) {
    onChange(option.value);
    setOpen(false);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    setHighlightedIndex(0);
  }

  function handleInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[highlightedIndex];
      if (option) selectOption(option);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream transition-colors focus:border-gold/50 focus:outline-none ${triggerClassName}`}
      >
        <span className={`truncate ${selected ? "" : "text-cream-dim/50"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`size-2.5 shrink-0 text-cream-dim transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-full max-w-[calc(100vw-2rem)] border border-gold/20 bg-panel shadow-lg">
          <div className="flex items-center gap-2 border-b border-grid-line px-3 py-2">
            <SearchIcon className="size-3.5 shrink-0 text-cream-dim" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:outline-none"
            />
          </div>

          <ul role="listbox" aria-label={ariaLabel} className="max-h-60 overflow-y-auto p-1.5">
            {filtered.length === 0 && <li className="px-3 py-2 font-sans text-sm text-cream-dim">No results</li>}
            {filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-sans text-sm transition-colors hover:bg-gold/10 hover:text-gold-bright ${
                      isHighlighted ? "bg-gold/10 text-gold-bright" : isSelected ? "text-gold-bright" : "text-cream"
                    }`}
                  >
                    <span className="whitespace-nowrap">{option.label}</span>
                    {isSelected && <CheckIcon className="size-3 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
