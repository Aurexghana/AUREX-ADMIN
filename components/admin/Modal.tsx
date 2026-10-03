"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { easing } from "@/lib/motion";
import { CloseIcon } from "@/components/icons";

/**
 * Shared modal chrome for the Slot/Listing create-edit forms and the
 * Investment earnings-update action — same backdrop+panel treatment and
 * enter/exit timing as the main site's own JoinAurexModal (backdrop
 * click + Escape to close, body scroll locked while open), reused here
 * rather than three near-identical one-off modals.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-10 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-amainblack/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: easing.smooth }}
            className="relative flex w-full max-w-lg flex-col gap-5 border border-gold/20 bg-panel/95 p-6 backdrop-blur-2xl sm:p-8"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center text-cream-dim transition-colors hover:text-gold-bright"
            >
              <CloseIcon className="size-4" />
            </button>
            <div className="flex flex-col gap-1 pr-8">
              <h2 className="font-jakarta text-lg font-semibold text-cream sm:text-xl">{title}</h2>
              {description && <p className="font-sans text-sm text-cream-dim">{description}</p>}
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
