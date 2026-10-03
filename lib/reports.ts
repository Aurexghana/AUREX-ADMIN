/**
 * The Report/Complaint Inbox's own data - issues Investors and Business
 * Owners have filed via their dashboard's "Report" tab. Backed by
 * Aurex-backend's `/reports` endpoints.
 *
 * `category` is free text on the backend (each frontend keeps its own
 * per-role taxonomy - see Aurex-backend's reports.table.ts for why), not
 * the closed 5-value union this file used to define, so filter options
 * for it are built from whatever categories are actually present in the
 * fetched reports rather than a fixed list - see ReportsView.tsx.
 */

import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";

export type ReportPriority = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in_progress" | "resolved";

export const PRIORITY_LABEL: Record<ReportPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Highest-first rank - used for both the "Priority" sort and the
 *  default triage sort's tie-breaker. */
export const PRIORITY_RANK: Record<ReportPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const STATUS_LABEL: Record<ReportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

/** Open-first rank - the default triage sort's primary key. */
export const STATUS_RANK: Record<ReportStatus, number> = {
  open: 0,
  in_progress: 1,
  resolved: 2,
};

export type Report = {
  id: string;
  memberId: string;
  category: string;
  subject: string;
  description: string;
  attachment?: { fileName: string; uploadedAt: string; url: string };
  /** Null/undefined means "not related to a specific record". A flat
   *  label, not a typed link - the backend snapshots this as text rather
   *  than a live FK an admin UI could re-resolve (there's no admin-facing
   *  investments/listings lookup endpoint), see ReportDetailView.tsx. */
  relatedRecordLabel?: string;
  priority: ReportPriority;
  status: ReportStatus;
  submittedAt: string;
  adminResponse?: string;
  respondedAt?: string;
};

type ReportApiRow = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  priority: ReportPriority;
  status: ReportStatus;
  attachment_url: string | null;
  related_record_label: string | null;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

// Matches lib/applications.ts's own fileNameFromUrl/toDocumentRef helpers -
// not worth sharing a util module between the two for one tiny function.
function fileNameFromUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || url);
  } catch {
    return url;
  }
}

function toAttachment(url: string | null, uploadedAt: string): Report["attachment"] {
  const fileName = fileNameFromUrl(url);
  return fileName && url ? { fileName, uploadedAt, url } : undefined;
}

function toReport(row: ReportApiRow): Report {
  return {
    id: row.id,
    memberId: row.user_id,
    category: row.category,
    subject: row.subject,
    description: row.description,
    attachment: toAttachment(row.attachment_url, row.created_at),
    relatedRecordLabel: row.related_record_label ?? undefined,
    priority: row.priority,
    status: row.status,
    submittedAt: row.created_at,
    adminResponse: row.admin_response ?? undefined,
    respondedAt: row.responded_at ?? undefined,
  };
}

export async function getReports(filters: { status?: ReportStatus } = {}): Promise<Report[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.status) params.set("status", filters.status);
  try {
    const { data } = await cached(`reports:${params.toString()}`, () =>
      apiFetchPaginated<ReportApiRow>(`/reports?${params.toString()}`),
    );
    return data.map(toReport);
  } catch {
    return [];
  }
}

export async function getReportById(id: string): Promise<Report | undefined> {
  try {
    const { data } = await apiFetch<ReportApiRow>(`/reports/${id}`);
    return toReport(data);
  } catch {
    return undefined;
  }
}

export async function getOpenReportCount(): Promise<number> {
  try {
    const { pagination } = await cached("reports:count:open", () =>
      apiFetchPaginated<ReportApiRow>("/reports?status=open&limit=1"),
    );
    return pagination.total;
  } catch {
    return 0;
  }
}

export async function respondToReport(id: string, status: ReportStatus, response?: string): Promise<Report> {
  const { data } = await apiFetch<ReportApiRow>(`/reports/${id}/status`, {
    method: "PATCH",
    body: { status, response },
  });
  invalidate("reports");
  return toReport(data);
}
