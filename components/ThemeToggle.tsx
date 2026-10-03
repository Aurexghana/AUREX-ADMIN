"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { hoverScale, duration } from "@/lib/motion";

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <path
        d="M10 0.833V3M10 17v2.167M2.05 2.05l1.534 1.534M16.416 16.416l1.534 1.534M0.833 10H3M17 10h2.167M2.05 17.95l1.534-1.534M16.416 3.584l1.534-1.534"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17.5 11.892A8.334 8.334 0 1 1 8.108 2.5a6.667 6.667 0 0 0 9.392 9.392Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Imported from the main AUREX site's components/ThemeToggle.tsx - same
 * fixed bottom-right floating control, same data-theme mechanism (see
 * lib/theme.ts). Rendered once in the root layout (app/layout.tsx),
 * outside the (admin) route group's own shell, so it stays available on
 * every screen including a future login page - same "available
 * everywhere" reasoning as the main site's own copy.
 *
 * No `light:` overrides needed here or anywhere else in this app: every
 * class this button and the rest of the admin UI use (bg-ink, border-
 * grid-line, text-cream, etc.) are theme tokens already flipped by
 * app/globals.css's [data-theme="light"] block, imported verbatim from
 * the main site in Step 0.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <motion.button
      {...hoverScale}
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={isLight}
      className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center overflow-hidden border border-grid-line bg-ink/80 text-cream shadow-lg backdrop-blur-md transition-colors hover:text-gold-light"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isLight ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: duration.fast, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isLight ? <MoonIcon className="size-5" /> : <SunIcon className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
