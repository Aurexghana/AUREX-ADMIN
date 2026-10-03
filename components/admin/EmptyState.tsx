"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion";

/**
 * Shared "nothing here" placeholder for every list view. Every list in
 * this app is mock data today, so it's always populated - but once a
 * real backend is behind it, two genuinely different situations need
 * this same shell:
 *
 *   1. The list itself is empty (no applications/members/slots/etc.
 *      exist yet) - the section's own nav icon (AdminShell's NAV_LINKS),
 *      copy that explains what will show up here and how, and often a
 *      CTA that starts that first record.
 *   2. The list has records, but the current filter/search hides all of
 *      them - SearchIcon, "no results for this filter" copy, and a
 *      "Clear filters" action instead.
 *
 * Each view tells the two apart itself (typically: is the *unfiltered*
 * source array empty, or just the filtered one) and picks the icon/copy/
 * action accordingly - see each view's own call site.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex flex-col items-center gap-3 border border-grid-line bg-panel/20 px-6 py-12 text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-gold/10 text-gold-bright">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-jakarta text-sm font-semibold text-cream">{title}</h3>
        {description && <p className="max-w-sm font-sans text-sm text-cream-dim">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
