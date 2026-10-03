import { Variants } from "framer-motion";

// Imported 1:1 from the main AUREX site's lib/motion.ts - the single
// source of truth for every Framer Motion variant used across both apps.
// Do not add new one-off variants here; if a screen needs a new motion
// pattern, add it to the main site's lib/motion.ts first and re-sync.

export const getMotionSafeDuration = (base: number, prefersReducedMotion: boolean) =>
  prefersReducedMotion ? 0 : base;

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

// Same enter timing as pageTransition, opacity only - no `y`, and no
// `exit`. Used for the route-level transition in
// components/PageTransition.tsx, which:
//   - can't use `y`: that wrapper sits around each page's whole tree,
//     including any `fixed` chrome (a sidebar/topbar here), and any
//     `transform` (exactly how Framer Motion animates `y`) on an ancestor
//     creates a new containing block for `position: fixed` descendants - a
//     y-animated wrapper would briefly detach fixed chrome from the
//     viewport and reattach it to the transitioning wrapper instead.
//   - doesn't animate `exit` at all, on purpose: pairing this with
//     <AnimatePresence mode="wait"> to play an exit fade before the next
//     page mounts is a well-documented source of the outgoing page's exit
//     getting stuck and leaving a blank screen until a manual refresh.
//     There's no `exit` key here specifically so nothing reintroduces that
//     pattern by wrapping this in AnimatePresence again without reading
//     why it was removed.
// Kept as a separate export rather than editing pageTransition itself,
// which stays available as-is for any future spot (e.g. a modal) without a
// fixed-position descendant to worry about.
export const routeTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const scrollReveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const;

export const hoverScale = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

export const hoverLift = {
  whileHover: { y: -4 },
  whileTap: { y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

// A much more emphatic version of hoverLift - noticeable lift, a visible
// scale-up, and a slight tilt for the "should tilt or enlarge" feel - used
// on the main site's How it Works / Why Aurex cards specifically. Kept
// separate from hoverLift rather than amplifying it in place. Not expected
// to see much use in this admin app (per the brief, admin motion should
// stay subtle/snappy, not showcase-y) but reproduced here for fidelity
// with the source file.
export const hoverLiftStrong = {
  whileHover: {
    y: -14,
    scale: 1.07,
    rotate: -1.5,
    boxShadow: "0 24px 48px -12px rgba(212, 175, 55, 0.35)",
  },
  whileTap: { y: -4, scale: 1.02, rotate: 0 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
} as const;

export const easing = {
  smooth: [0.22, 1, 0.36, 1],
  snappy: [0.4, 0, 0.2, 1],
} as const;

export const duration = {
  fast: 0.2,
  base: 0.4,
  slow: 0.6,
} as const;
