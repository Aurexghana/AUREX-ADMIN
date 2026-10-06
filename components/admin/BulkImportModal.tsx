"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { hoverScale } from "@/lib/motion";
import Modal from "@/components/admin/Modal";
import { SpinnerIcon, UploadIcon } from "@/components/icons";
import { MAX_IMPORT_ROWS, csvToRecords, downloadCsv, parseCsv, runThrottled } from "@/lib/bulkImport";

export type ParsedRow<T> = { ok: true; value: T; label: string } | { ok: false; error: string };

type PreviewRow<T> = {
  /** 1-based spreadsheet line (header is line 1), so errors match what the admin sees in their file. */
  line: number;
  label: string;
  value?: T;
  error?: string;
  status: "ready" | "invalid" | "importing" | "imported" | "failed";
  message?: string;
};

const BUTTON_CLASSNAME =
  "bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-40";
const SECONDARY_BUTTON_CLASSNAME =
  "border border-grid-line px-4 py-2.5 font-jakarta text-sm font-medium text-cream-dim transition-colors hover:text-cream";

const STATUS_LABEL: Record<PreviewRow<unknown>["status"], string> = {
  ready: "Ready",
  invalid: "Skipped",
  importing: "Importing…",
  imported: "Imported",
  failed: "Failed",
};

const STATUS_CLASSNAME: Record<PreviewRow<unknown>["status"], string> = {
  ready: "text-cream-dim",
  invalid: "text-red-400",
  importing: "text-gold-bright",
  imported: "text-gold-bright",
  failed: "text-red-400",
};

function BulkImportBody<T>({
  templateFilename,
  templateRows,
  columnHelp,
  requiredHeaders,
  parseRow,
  importRow,
  onImported,
  noun,
}: {
  templateFilename: string;
  templateRows: string[][];
  columnHelp: string[];
  requiredHeaders: string[];
  parseRow: (record: Record<string, string>) => ParsedRow<T>;
  importRow: (value: T) => Promise<void>;
  onImported: (count: number) => void;
  noun: string;
}) {
  const [rows, setRows] = useState<PreviewRow<T>[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"pick" | "preview" | "running" | "done">("pick");
  const cancelledRef = useRef(false);
  const importedCountRef = useRef(0);
  const reportedRef = useRef(false);
  const onImportedRef = useRef(onImported);

  useEffect(() => {
    onImportedRef.current = onImported;
  }, [onImported]);

  // Closing the modal mid-import stops the run; whatever already went
  // through is still reported so the page can refresh.
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (importedCountRef.current > 0 && !reportedRef.current) {
        reportedRef.current = true;
        onImportedRef.current(importedCountRef.current);
      }
    };
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    setFileName(file.name);
    if (!/\.csv$/i.test(file.name)) {
      setFileError("Please choose a .csv file. In Excel or Sheets, use Save As / Download as CSV.");
      return;
    }
    const parsed = csvToRecords(parseCsv(await file.text()));
    const missing = requiredHeaders.filter((h) => !parsed.headers.includes(h));
    if (missing.length > 0) {
      setFileError(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Download the template to see the expected layout.`);
      return;
    }
    if (parsed.records.length === 0) {
      setFileError("This file has no data rows.");
      return;
    }
    if (parsed.records.length > MAX_IMPORT_ROWS) {
      setFileError(`This file has ${parsed.records.length} rows. Please import at most ${MAX_IMPORT_ROWS} at a time.`);
      return;
    }
    setRows(
      parsed.records.map((record, i): PreviewRow<T> => {
        const result = parseRow(record);
        return result.ok
          ? { line: i + 2, label: result.label, value: result.value, status: "ready" }
          : { line: i + 2, label: record[requiredHeaders[0]] || "(blank)", error: result.error, status: "invalid" };
      }),
    );
    setPhase("preview");
  }

  const readyCount = rows.filter((r) => r.status === "ready").length;
  const invalidCount = rows.filter((r) => r.status === "invalid").length;
  const importedCount = rows.filter((r) => r.status === "imported").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;

  async function handleImport() {
    const queue = rows.map((r, index) => ({ r, index })).filter(({ r }) => r.status === "ready");
    setPhase("running");
    await runThrottled(
      queue,
      async ({ r, index }) => {
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, status: "importing" } : row)));
        await importRow(r.value as T);
      },
      (queueIndex, outcome) => {
        const { index } = queue[queueIndex];
        if (outcome.ok) importedCountRef.current += 1;
        setRows((prev) =>
          prev.map((row, i) =>
            i === index
              ? outcome.ok
                ? { ...row, status: "imported", message: undefined }
                : { ...row, status: "failed", message: outcome.message }
              : row,
          ),
        );
      },
      () => cancelledRef.current,
    );
    if (cancelledRef.current) return;
    setPhase("done");
    if (importedCountRef.current > 0 && !reportedRef.current) {
      reportedRef.current = true;
      onImportedRef.current(importedCountRef.current);
    }
  }

  function reset() {
    setRows([]);
    setFileName("");
    setFileError(null);
    setPhase("pick");
  }

  return (
    <div className="flex flex-col gap-4">
      {phase === "pick" && (
        <>
          <div className="flex flex-col gap-2 border border-grid-line bg-panel/20 p-4">
            <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">1. Get the template</span>
            <p className="font-sans text-sm text-cream-dim">
              Fill it in with Excel, Sheets or any editor, then save it as .csv. Up to {MAX_IMPORT_ROWS} rows per file.
            </p>
            <ul className="list-disc pl-5 font-sans text-xs text-cream-dim">
              {columnHelp.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div>
              <button type="button" onClick={() => downloadCsv(templateFilename, templateRows)} className={SECONDARY_BUTTON_CLASSNAME}>
                Download template
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border border-grid-line bg-panel/20 p-4">
            <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">2. Upload your file</span>
            <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 px-4 py-6 font-sans text-sm text-cream-dim transition-colors hover:border-gold/60 hover:text-cream">
              <UploadIcon className="size-4" />
              <span>{fileName || "Choose a .csv file"}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {fileError && <p className="font-sans text-xs text-red-400">{fileError}</p>}
          </div>
        </>
      )}

      {phase !== "pick" && (
        <>
          <p className="font-sans text-sm text-cream-dim">
            {phase === "preview" && (
              <>
                {readyCount} {noun}
                {readyCount === 1 ? "" : "s"} ready to import
                {invalidCount > 0 && `, ${invalidCount} skipped because of errors`}.
              </>
            )}
            {phase === "running" && `Importing… ${importedCount + failedCount} of ${rows.filter((r) => r.status !== "invalid").length} done. Keep this window open; rows go one at a time to stay within the rate limit.`}
            {phase === "done" && `Finished: ${importedCount} imported${failedCount > 0 ? `, ${failedCount} failed` : ""}${invalidCount > 0 ? `, ${invalidCount} skipped` : ""}.`}
          </p>

          <div className="max-h-72 overflow-y-auto border border-grid-line">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-panel">
                <tr className="border-b border-grid-line">
                  <th className="px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Row</th>
                  <th className="px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">{noun}</th>
                  <th className="px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.line} className="border-b border-grid-line last:border-b-0 align-top">
                    <td className="px-3 py-2 font-sans text-xs text-cream-dim">{row.line}</td>
                    <td className="px-3 py-2 font-sans text-sm text-cream">{row.label}</td>
                    <td className={`px-3 py-2 font-sans text-xs ${STATUS_CLASSNAME[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                      {(row.error || row.message) && <span className="block text-cream-dim">{row.error ?? row.message}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {phase === "preview" && (
              <>
                <motion.button {...hoverScale} type="button" onClick={handleImport} disabled={readyCount === 0} className={BUTTON_CLASSNAME}>
                  Import {readyCount} {noun}
                  {readyCount === 1 ? "" : "s"}
                </motion.button>
                <button type="button" onClick={reset} className={SECONDARY_BUTTON_CLASSNAME}>
                  Choose a different file
                </button>
              </>
            )}
            {phase === "running" && (
              <span className="flex items-center gap-2 font-sans text-sm text-cream-dim">
                <SpinnerIcon className="size-4 animate-spin" /> Working…
              </span>
            )}
            {phase === "done" && (
              <button type="button" onClick={reset} className={SECONDARY_BUTTON_CLASSNAME}>
                Import another file
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Bulk-import dialog shared by the Members and Businesses pages: template
 *  download, CSV upload, per-row validation preview, then a throttled
 *  one-by-one import (see lib/bulkImport.ts). */
export default function BulkImportModal<T>({
  isOpen,
  onClose,
  title,
  description,
  ...body
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
} & React.ComponentProps<typeof BulkImportBody<T>>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <BulkImportBody<T> {...body} />
    </Modal>
  );
}
