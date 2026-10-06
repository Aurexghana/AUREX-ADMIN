/**
 * Shared helpers for the bulk Investor / Business import: a small CSV
 * reader/writer (no dependency - templates are plain .csv, which Excel and
 * Google Sheets both open and save), a template download, and a throttled
 * sequential runner so a big file doesn't trip the API's rate limit.
 */

import { ApiError } from "@/lib/api/client";

/** Pause between rows, so a large import stays under the API's rate limit. */
const ROW_DELAY_MS = 400;
/** How long to back off when the API answers 429, before retrying that row. */
const RATE_LIMIT_BACKOFF_MS = 3000;
const MAX_RATE_LIMIT_RETRIES = 3;

export const MAX_IMPORT_ROWS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parses CSV text into rows of cells. Handles quoted cells (with commas,
 *  newlines and "" escapes), CRLF/LF line endings and a leading BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const source = text.replace(/^﻿/, "");

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsv(rows: string[][]): string {
  return rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, rows: string[][]) {
  // BOM so Excel reads the file as UTF-8.
  const blob = new Blob(["﻿" + buildCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Turns a parsed CSV into one record per data row, keyed by the header
 *  names (lower-cased, spaces/dashes folded to underscores). */
export function csvToRecords(rows: string[][]): { headers: string[]; records: Record<string, string>[] } {
  const [headerRow = [], ...dataRows] = rows;
  const headers = headerRow.map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const records = dataRows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = (cells[i] ?? "").trim();
    });
    return record;
  });
  return { headers, records };
}

export type RowOutcome = { ok: true } | { ok: false; message: string };

/** Runs `task` for each item one at a time (never in parallel), pausing
 *  between rows and backing off + retrying on 429s. A failed row doesn't
 *  stop the rest. */
export async function runThrottled<T>(
  items: T[],
  task: (item: T) => Promise<void>,
  onProgress: (index: number, outcome: RowOutcome) => void,
  isCancelled: () => boolean,
) {
  for (let i = 0; i < items.length; i++) {
    if (isCancelled()) return;
    let outcome: RowOutcome = { ok: true };
    for (let attempt = 0; ; attempt++) {
      try {
        await task(items[i]);
        outcome = { ok: true };
        break;
      } catch (err) {
        if (err instanceof ApiError && err.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
          await sleep(RATE_LIMIT_BACKOFF_MS * (attempt + 1));
          if (isCancelled()) return;
          continue;
        }
        outcome = {
          ok: false,
          message: err instanceof ApiError ? err.message : "Something went wrong.",
        };
        break;
      }
    }
    onProgress(i, outcome);
    if (i < items.length - 1) await sleep(ROW_DELAY_MS);
  }
}
