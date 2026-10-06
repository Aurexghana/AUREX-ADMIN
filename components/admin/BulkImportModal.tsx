"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { hoverScale } from "@/lib/motion";
import Modal from "@/components/admin/Modal";
import { SpinnerIcon, UploadIcon } from "@/components/icons";
import { ApiError, apiDownload, apiUpload } from "@/lib/api/client";

export type BulkImportType = "investor" | "business";

type RowResult =
  | { row: number; status: "created"; email: string; emailSent: boolean }
  | { row: number; status: "failed"; email?: string; error: string };

type BulkImportResponse = { total: number; created: number; failed: number; emailsFailed: number; results: RowResult[] };

const BUTTON_CLASSNAME =
  "bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-40";
const SECONDARY_BUTTON_CLASSNAME =
  "border border-grid-line px-4 py-2.5 font-jakarta text-sm font-medium text-cream-dim transition-colors hover:text-cream";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function BulkImportBody({
  type,
  columnHelp,
  onImported,
  noun,
}: {
  type: BulkImportType;
  columnHelp: string[];
  onImported: (count: number) => void;
  noun: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResponse | null>(null);

  function handleFile(picked: File | undefined) {
    if (!picked) return;
    setFileError(null);
    if (!/\.xlsx?$/i.test(picked.name)) {
      setFileError("Please choose an Excel file (.xlsx). Use the template below.");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFileError("This file is larger than 5 MB.");
      return;
    }
    setFile(picked);
  }

  async function handleDownload() {
    setIsDownloading(true);
    setFileError(null);
    try {
      const blob = await apiDownload(`/applications/bulk-upload/template?type=${type}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aurex-${type}s-template.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setFileError(err instanceof ApiError ? err.message : "Couldn't download the template.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setFileError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const { data } = await apiUpload<BulkImportResponse>(`/applications/bulk-upload?type=${type}`, formData);
      setResult(data);
      if (data.created > 0) onImported(data.created);
    } catch (err) {
      setFileError(err instanceof ApiError ? err.message : "Couldn't upload this file.");
    } finally {
      setIsUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setFileError(null);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-sans text-sm text-cream-dim">
          Finished: {result.created} {noun}
          {result.created === 1 ? "" : "s"} added
          {result.failed > 0 ? `, ${result.failed} failed` : ""}.{" "}
          {result.emailsFailed > 0
            ? `${result.emailsFailed} activation email${result.emailsFailed === 1 ? "" : "s"} couldn't be sent; use Resend activation for those accounts.`
            : "Activation emails sent."}
        </p>
        {result.failed > 0 && (
          <div className="max-h-72 overflow-y-auto border border-grid-line">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-panel">
                <tr className="border-b border-grid-line">
                  <th className="px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Row</th>
                  <th className="px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Problem</th>
                </tr>
              </thead>
              <tbody>
                {result.results
                  .filter((r) => r.status === "failed")
                  .map((r) => (
                    <tr key={r.row} className="border-b border-grid-line align-top last:border-b-0">
                      <td className="px-3 py-2 font-sans text-xs text-cream-dim">{r.row}</td>
                      <td className="px-3 py-2 font-sans text-xs text-red-400">
                        {r.email && <span className="block text-cream">{r.email}</span>}
                        {r.status === "failed" && r.error}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <div>
          <button type="button" onClick={reset} className={SECONDARY_BUTTON_CLASSNAME}>
            Import another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 border border-grid-line bg-panel/20 p-4">
        <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">1. Get the template</span>
        <ul className="list-disc pl-5 font-sans text-xs text-cream-dim">
          {columnHelp.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div>
          <button type="button" onClick={handleDownload} disabled={isDownloading} className={`${SECONDARY_BUTTON_CLASSNAME} w-[70%]`}>
            {isDownloading ? "Preparing…" : "Download template"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border border-grid-line bg-panel/20 p-4">
        <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">2. Upload your file</span>
        <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 px-4 py-6 font-sans text-sm text-cream-dim transition-colors hover:border-gold/60 hover:text-cream">
          <UploadIcon className="size-4" />
          <span>{file?.name || "Choose an .xlsx file"}</span>
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {fileError && <p className="font-sans text-xs text-red-400">{fileError}</p>}
      </div>

      <div className="flex items-center gap-3">
        <motion.button {...hoverScale} type="button" onClick={handleUpload} disabled={!file || isUploading} className={BUTTON_CLASSNAME}>
          {isUploading ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : `Import ${noun}s`}
        </motion.button>
        {isUploading && <span className="font-sans text-sm text-cream-dim">Adding accounts and sending emails, keep this window open.</span>}
      </div>
    </div>
  );
}

export default function BulkImportModal({
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
} & React.ComponentProps<typeof BulkImportBody>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <BulkImportBody {...body} />
    </Modal>
  );
}
