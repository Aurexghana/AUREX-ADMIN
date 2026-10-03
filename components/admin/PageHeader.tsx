"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion";

/**
 * Consistent title band for every admin page - title + optional
 * description + an optional right-aligned action slot (e.g. "Create
 * Slot", "Add Block"). Wrapped in `staggerItem` so it participates in
 * whatever `staggerContainer` the page wraps it in, same stagger-in
 * treatment as the main site's own section headers.
 */
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-jakarta text-xl font-semibold text-cream sm:text-2xl">{title}</h1>
        {description && <p className="font-sans text-sm text-cream-dim">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </motion.div>
  );
}
