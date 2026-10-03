"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { easing } from "@/lib/motion";
import { AlertIcon, SpinnerIcon } from "@/components/icons";

/**
 * A centered "are you sure" dialog - per feedback with a reference
 * screenshot (a "Delete File" confirm card): every consequential admin
 * action should ask before it fires, not only the ones that destroy
 * data outright. Used for approve/reject, suspend/reactivate, publish/
 * close-early, and remove - see each view's own call site for why that
 * one action qualifies as "important" here.
 *
 * Deliberately its own small centered layout (icon, title, description,
 * Cancel + action) rather than the general-purpose Modal's left-aligned
 * form chrome - this is a yes/no decision, not a place for more fields.
 * Square corners throughout, same as this app's cards/borders and its
 * own Select dropdown - the reference's rounded card/icon badge aren't
 * carried over, consistent with every other "take the design, not the
 * rounding" ask so far.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "gold";
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isConfirming, onClose]);

  const toneColor = tone === "danger" ? "#f87171" : "var(--color-gold-bright)";

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isConfirming}
            className="fixed inset-0 bg-amainblack/70 backdrop-blur-sm disabled:cursor-not-allowed"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: easing.smooth }}
            className="relative flex w-full max-w-sm flex-col items-center gap-4 border border-gold/20 bg-panel/95 p-6 text-center backdrop-blur-2xl"
          >
            <span
              className="flex size-11 items-center justify-center border"
              style={{ borderColor: `${toneColor}4d`, color: toneColor, backgroundColor: `${toneColor}1a` }}
            >
              <AlertIcon className="size-5" />
            </span>

            <div className="flex flex-col gap-1.5">
              <h2 id="confirm-dialog-title" className="font-jakarta text-lg font-semibold text-cream">
                {title}
              </h2>
              {description && <p className="font-sans text-sm text-cream-dim">{description}</p>}
            </div>

            <div className="mt-1 flex w-full items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirming}
                className="flex-1 border border-grid-line px-4 py-2.5 font-jakarta text-sm font-medium text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className={
                  tone === "danger"
                    ? "flex-1 border border-[#f87171] bg-[#f87171]/10 px-4 py-2.5 font-jakarta text-sm font-medium text-[#f87171] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    : "flex-1 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
                }
              >
                {isConfirming ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
