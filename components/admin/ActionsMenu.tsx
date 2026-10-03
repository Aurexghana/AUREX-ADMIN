"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVerticalIcon } from "@/components/icons";
import { iconButtonClassName } from "@/components/admin/tableStyles";

export type ActionMenuItem = {
  key: string;
  label: string;
  onClick: () => void;
  tone?: "neutral" | "gold" | "danger";
  icon?: (props: import("react").SVGProps<SVGSVGElement>) => React.ReactElement;
};

const ITEM_TONE_CLASSNAME = {
  neutral: "text-cream hover:bg-gold/10 hover:text-gold-bright",
  gold: "text-gold-bright hover:bg-gold/10",
  danger: "text-[#f87171] hover:bg-[#f87171]/10",
} as const;

const MENU_WIDTH_PX = 152; // matches min-w-[9.5rem] below
const ITEM_HEIGHT_PX = 36;
const MENU_PADDING_PX = 12; // p-1.5 top + bottom
const VIEWPORT_MARGIN_PX = 8;

/**
 * Row actions collapsed behind a 3-dot trigger, replacing a row of loose
 * buttons - per feedback, once a row's actions grow past one or two, they
 * read better tucked behind a menu than laid out inline. Same click-
 * outside/Escape-to-close and "build our own, don't fight native chrome"
 * approach as Select.tsx; square panel + rows to match this app's own
 * "round only for icon buttons/status dots" rule (tableStyles.ts).
 *
 * Rendered through a portal at document.body with `position: fixed`
 * coordinates computed from the trigger button, rather than an
 * `absolute` child of it - per feedback, the Investment Slots table's
 * own `overflow-x-auto` wrapper (which the browser also computes an
 * overflow-y: auto for, being a mixed-overflow box) was clipping the
 * open menu against the table's own bounds instead of letting it float
 * over the page. Portaling escapes that ancestor's overflow entirely.
 *
 * Position is recomputed every animation frame while open, not just
 * once on open/scroll/resize - per feedback, a menu opened while its
 * own row was still mid-transition (the page's entrance stagger, a row
 * still animating in after the status filter changes, a banner above
 * the table pushing rows down) went stale a frame later and drifted out
 * from under its trigger, landing on top of/behind the wrong row. A
 * short-lived rAF loop is cheap enough for a UI element that's only
 * ever open briefly.
 */
export default function ActionsMenu({ items, label = "Row actions" }: { items: ActionMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => setMounted(true), []);

  const reposition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = items.length * ITEM_HEIGHT_PX + MENU_PADDING_PX;

    let left = rect.right - MENU_WIDTH_PX;
    left = Math.max(VIEWPORT_MARGIN_PX, Math.min(left, window.innerWidth - MENU_WIDTH_PX - VIEWPORT_MARGIN_PX));

    const fitsBelow = rect.bottom + 8 + menuHeight <= window.innerHeight - VIEWPORT_MARGIN_PX;
    const top = fitsBelow ? rect.bottom + 8 : Math.max(VIEWPORT_MARGIN_PX, rect.top - 8 - menuHeight);

    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let frame = requestAnimationFrame(function tick() {
      reposition();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={iconButtonClassName("neutral")}
      >
        <MoreVerticalIcon className="size-4" />
      </button>

      {open &&
        mounted &&
        position &&
        createPortal(
          <ul
            ref={menuRef}
            role="menu"
            aria-label={label}
            style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH_PX }}
            className="z-50 border border-gold/20 bg-panel p-1.5 shadow-lg"
          >
            {items.map((item) => (
              <li key={item.key} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm whitespace-nowrap transition-colors ${
                    ITEM_TONE_CLASSNAME[item.tone ?? "neutral"]
                  }`}
                >
                  {item.icon && <item.icon className="size-3.5 shrink-0" />}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}
