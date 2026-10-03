"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import BrandLogo from "@/components/BrandLogo";
import { slideUp } from "@/lib/motion";

/**
 * Shared chrome for the three auth pages (login, forgot password, reset
 * password) - the one spot in this app that mounts AnimatedBackground
 * (see that component's own comment: reserved for the login screen,
 * every list/table admin page under (admin) deliberately skips it).
 *
 * Lives outside the (admin) route group on purpose - see that group's
 * layout.tsx comment - so none of these pages inherit the sidebar/topbar
 * shell or sit behind AuthGate.
 */
export default function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12">
      <AnimatedBackground />

      <motion.div
        variants={slideUp}
        initial="initial"
        animate="animate"
        className="relative flex w-full max-w-md flex-col gap-6 border border-gold/20 bg-panel/60 p-8 backdrop-blur-2xl sm:p-10"
      >
        {/* Not a Link - every real destination behind "/" requires a
            session, so a signed-out visitor clicking through would only
            bounce straight back to this same page via AuthGate. */}
        <BrandLogo className="mx-auto h-10 w-auto shrink-0" />

        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="font-jakarta text-xl font-semibold text-cream sm:text-2xl">{title}</h1>
          {description && <p className="font-sans text-sm text-cream-dim">{description}</p>}
        </div>

        {children}

        {footer && <div className="text-center font-sans text-sm text-cream-dim">{footer}</div>}
      </motion.div>
    </div>
  );
}
