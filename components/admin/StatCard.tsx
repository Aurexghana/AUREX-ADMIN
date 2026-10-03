"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { staggerItem, hoverLift } from "@/lib/motion";

/**
 * One at-a-glance stat tile on the Admin Overview page - always a link
 * into the section it summarizes, per the brief ("each stat links into
 * its relevant section below"). `hoverLift` (not `hoverScale`) matches
 * the main site's own card-hover treatment for a clickable tile, rather
 * than a scale-up meant for buttons.
 *
 * `icon` reuses the exact same icon already used for that section's own
 * nav link (see AdminShell's NAV_LINKS) - per feedback asking for an
 * image on each stat, this borrows what already exists rather than
 * introducing new artwork solely for this tile. The earlier
 * gradient-and-glow accent bar tried here is removed per that same
 * feedback ("the line beneath it is not necessary").
 */
export default function StatCard({
  label,
  value,
  href,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  sublabel?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <motion.div variants={staggerItem}>
      <Link href={href} className="block h-full">
        <motion.div
          {...hoverLift}
          className="flex h-full flex-col gap-2 border border-gold/20 bg-panel/40 p-5 backdrop-blur-2xl transition-colors hover:border-gold/40 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-bright">
              <Icon className="size-4" />
            </span>
          </div>
          <span className="font-jakarta text-2xl font-bold text-gold-bright sm:text-3xl">{value}</span>
          {sublabel && <span className="font-sans text-xs text-cream-dim">{sublabel}</span>}
        </motion.div>
      </Link>
    </motion.div>
  );
}
