"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { routeTransition } from "@/lib/motion";

/**
 * Imported 1:1 from the main AUREX site's components/PageTransition.tsx -
 * not one of the four files explicitly named in the Step 0 brief, but
 * brought in alongside lib/motion.ts since it's that file's own consumer
 * for "page transitions on navigation" (an explicit animation requirement
 * for this admin app) and defines no new variant of its own beyond
 * `routeTransition`, already imported. Flag if this wasn't wanted.
 *
 * Deliberately NOT wrapped in <AnimatePresence>: see the main site's own
 * copy of this file for why (a real, hard-to-reproduce bug with
 * AnimatePresence + the App Router got the exit phase stuck on a blank
 * page). What's left is an enter-only fade: React swaps the old keyed
 * element for the new one immediately, and the new page just fades in via
 * `routeTransition`. Less precious than a true crossfade, but nothing here
 * can get stuck.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // flex flex-1 flex-col so this wrapper carries forward the sticky-
    // footer layout chain instead of collapsing to its own content height.
    <motion.div key={pathname} variants={routeTransition} initial="initial" animate="animate" className="flex flex-1 flex-col">
      {children}
    </motion.div>
  );
}
