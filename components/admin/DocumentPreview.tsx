"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { easing, hoverScale } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import { DocumentIcon, CloseIcon, ZoomInIcon, ZoomOutIcon, ExternalLinkIcon } from "@/components/icons";

function getFileKind(fileNameOrUrl: string): "image" | "pdf" | "unknown" {
  const ext = fileNameOrUrl.split(".").pop()?.toLowerCase().split(/[?#]/)[0];
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return "image";
  if (ext === "pdf") return "pdf";
  return "unknown";
}

function FileSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`flex w-full animate-pulse items-center justify-center border border-grid-line bg-panel/40 ${
        tall ? "h-[65vh]" : "h-[45vh]"
      }`}
    >
      <DocumentIcon className="size-10 text-cream-dim/20" />
    </div>
  );
}

export default function DocumentPreview({
  label,
  fileName,
  uploadedAt,
  url,
}: {
  label: string;
  fileName: string;
  uploadedAt?: string;
  url?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const kind = url ? getFileKind(fileName || url) : "unknown";
  const isRealImage = url && kind === "image";
  const isRealPdf = url && kind === "pdf";

  return (
    <>
      <div className="flex items-center justify-between gap-3 border border-grid-line bg-panel/20 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <DocumentIcon className="size-5 shrink-0 text-gold-muted" />
          <div className="flex min-w-0 flex-col">
            <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
            <span className="truncate font-jakarta text-sm text-cream">{fileName}</span>
          </div>
        </div>
        <motion.button
          {...hoverScale}
          type="button"
          onClick={() => {
            setZoomed(false);
            setLoaded(false);
            setOpen(true);
          }}
          className="shrink-0 border border-gold/30 px-3 py-1.5 font-jakarta text-xs font-medium text-gold-bright transition-colors hover:border-gold hover:bg-gold/5"
        >
          View
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-amainblack/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.35, ease: easing.smooth }}
              className={`relative flex w-full flex-col gap-4 border border-gold/20 bg-panel/95 p-6 backdrop-blur-2xl transition-[max-width,max-height] duration-200 ${
                zoomed ? "max-w-6xl max-h-[92vh]" : "max-w-2xl max-h-[85vh]"
              }`}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 flex size-8 items-center justify-center text-cream-dim transition-colors hover:text-gold-bright"
              >
                <CloseIcon className="size-4" />
              </button>

              <div className="flex flex-col gap-1 pr-16">
                <h2 className="font-jakarta text-lg font-semibold text-cream">{label}</h2>
                <p className="font-sans text-xs text-cream-dim">
                  {fileName}
                  {uploadedAt && ` (uploaded ${formatDisplayDate(uploadedAt)})`}
                </p>
              </div>

              {isRealImage ? (
                <>
                  <div className={`min-h-0 flex-1 ${zoomed ? "overflow-auto" : "flex items-center justify-center overflow-hidden"}`}>
                    {!loaded && <FileSkeleton />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${label}: ${fileName}`}
                      onLoad={() => setLoaded(true)}
                      className={
                        !loaded
                          ? "hidden"
                          : zoomed
                            ? "h-auto w-auto max-w-none border border-grid-line"
                            : "max-h-[60vh] w-auto max-w-full border border-grid-line object-contain"
                      }
                    />
                  </div>
                  {loaded && (
                    <div className="flex items-center justify-between gap-3">
                      <motion.button
                        {...hoverScale}
                        type="button"
                        onClick={() => setZoomed((z) => !z)}
                        className="flex items-center gap-1.5 border border-gold/30 px-3 py-1.5 font-jakarta text-xs font-medium text-gold-bright transition-colors hover:border-gold hover:bg-gold/5"
                      >
                        {zoomed ? <ZoomOutIcon className="size-3.5" /> : <ZoomInIcon className="size-3.5" />}
                        {zoomed ? "Zoom Out" : "Zoom In"}
                      </motion.button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-sans text-xs text-cream-dim transition-colors hover:text-gold-bright"
                      >
                        <ExternalLinkIcon className="size-3.5" /> Open Original
                      </a>
                    </div>
                  )}
                </>
              ) : isRealPdf ? (
                <>
                  {!loaded && <FileSkeleton tall />}
                  <iframe
                    src={url}
                    title={`${label}: ${fileName}`}
                    onLoad={() => setLoaded(true)}
                    className={`h-[65vh] w-full border border-grid-line bg-white ${!loaded ? "hidden" : ""}`}
                  />
                  {loaded && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-fit items-center gap-1.5 font-sans text-xs text-cream-dim transition-colors hover:text-gold-bright"
                    >
                      <ExternalLinkIcon className="size-3.5" /> Open Original
                    </a>
                  )}
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/mock/document-placeholder.svg" alt="" className="w-full border border-grid-line" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
