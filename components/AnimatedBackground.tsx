"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Imported 1:1 from the main AUREX site's components/AnimatedBackground.tsx
 * - the "Ambient Lighting Effects" backdrop: a soft gold glow, a warm
 * highlight bleeding in from the top right, and a dark umber bloom bleeding
 * in from the bottom left, over a faint full-bleed gradient overlay.
 *
 * Per the admin brief, this is NOT mounted in the root layout the way the
 * main site mounts it behind every page - admin list/table screens are
 * utility-first and shouldn't carry a decorative animated backdrop. Reserve
 * it for the (not-yet-built) login screen only, and keep it minimal there.
 *
 * aria-hidden and pointer-events-none so it never affects a11y or
 * interaction; motion is skipped entirely when the user prefers reduced
 * motion.
 */
export default function AnimatedBackground() {
  const prefersReducedMotion = useReducedMotion();
  const driftDuration = prefersReducedMotion ? 0 : 10;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* central gold glow - the exact radial-gradient vector Figma exports
          for this node, reproduced as inline SVG rather than approximated
          with a hand-rolled CSS gradient. Centered on the full page height,
          matching the design's top:50% (the ambient layer spans the whole
          scrollable page, not just the hero). */}
      <motion.svg
        viewBox="0 0 800 800"
        className="absolute left-1/2 top-1/2 size-[800px] -translate-x-1/2 -translate-y-1/2"
        animate={
          prefersReducedMotion
            ? {}
            : { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }
        }
        transition={{ duration: driftDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="0" y="0" width="100%" height="100%" fill="url(#aurex-ambient-glow)" />
        <defs>
          <radialGradient
            id="aurex-ambient-glow"
            gradientUnits="userSpaceOnUse"
            cx="0"
            cy="0"
            r="10"
            gradientTransform="matrix(56.569 0 0 56.569 400 400)"
          >
            <stop stopColor="rgba(212,175,55,0.05)" offset="0" />
            <stop stopColor="rgba(212,175,55,0)" offset="0.7" />
          </radialGradient>
        </defs>
      </motion.svg>

      {/* top-right warm highlight */}
      <motion.div
        className="absolute -right-[200px] -top-[300px] size-[600px] rounded-full bg-gold-muted/5 blur-[60px]"
        animate={
          prefersReducedMotion ? {} : { x: [0, -20, 0], y: [0, 25, 0] }
        }
        transition={{ duration: driftDuration * 1.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* bottom-left umber bloom */}
      <motion.div
        className="absolute -bottom-[267px] -left-[200px] size-[800px] rounded-full bg-umber/20 blur-[75px]"
        animate={
          prefersReducedMotion ? {} : { x: [0, 20, 0], y: [0, -20, 0] }
        }
        transition={{ duration: driftDuration * 1.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* faint full-bleed vignette/gradient overlay from the design */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src="/brand/ambient-lighting.svg"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
