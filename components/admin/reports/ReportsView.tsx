"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import { type BadgeTone } from "@/components/admin/StatusBadge";
import StatusDot from "@/components/admin/StatusDot";
import PriorityTag from "@/components/admin/reports/PriorityTag";
import Select from "@/components/admin/Select";
import EmptyState from "@/components/admin/EmptyState";
import Pagination from "@/components/admin/Pagination";
import { AVATAR_CLASSNAME, DANGER_ROW_CLASSNAME, handleRowClick } from "@/components/admin/tableStyles";
import { ArrowUpIcon, ArrowDownIcon, BookIcon, SearchIcon, SpinnerIcon } from "@/components/icons";
import { useSession } from "@/lib/auth";
import { getReports, PRIORITY_LABEL, PRIORITY_RANK, STATUS_LABEL, STATUS_RANK, type Report, type ReportPriority, type ReportStatus } from "@/lib/reports";
import { fetchMembers, type Member, type MemberTrack } from "@/lib/members";

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  open: "neutral",
  in_progress: "gold",
  resolved: "success",
};

const PRIORITY_TONE: Record<ReportPriority, BadgeTone> = {
  low: "success",
  medium: "neutral",
  high: "gold",
  critical: "danger",
};

const TRACK_LABEL: Record<MemberTrack, string> = {
  investor: "Investor",
  business: "Business Owner",
};

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "investor", label: "Investor" },
  { value: "business", label: "Business Owner" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  ...(Object.keys(PRIORITY_LABEL) as ReportPriority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p] })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...(Object.keys(STATUS_LABEL) as ReportStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

type SortKey = "triage" | "date" | "priority";

const PAGE_SIZE = 10;

/** Open (or in-progress) + high/critical-priority reports get the same
 *  red-accent row treatment DANGER_ROW_CLASSNAME uses elsewhere for
 *  rejected/suspended/closed rows - a different meaning (urgent, not
 *  negative) but the same "needs your attention" red reads fine for
 *  both, and reusing it means one less color introduced into this
 *  screen. Already-resolved reports never get it: nothing left to triage. */
function isUrgent(report: Report): boolean {
  return report.status !== "resolved" && (report.priority === "high" || report.priority === "critical");
}

function compareReports(a: Report, b: Report, sortKey: SortKey, sortDir: "asc" | "desc"): number {
  if (sortKey === "date") {
    const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    return sortDir === "asc" ? diff : -diff;
  }
  if (sortKey === "priority") {
    const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    return sortDir === "asc" ? diff : -diff;
  }
  // Default triage sort: open before in-progress before resolved, then
  // highest priority first, then newest first - "open + high-priority
  // reports surfaced first" per the brief, without needing either sort
  // button pressed.
  const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (statusDiff !== 0) return statusDiff;
  const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 border px-3 py-2 font-sans text-sm transition-colors ${
        active ? "border-gold/40 bg-gold/5 text-gold-bright" : "border-grid-line bg-panel/60 text-cream-dim hover:text-cream"
      }`}
    >
      {label} {active && (dir === "desc" ? <ArrowDownIcon className="size-3" /> : <ArrowUpIcon className="size-3" />)}
    </button>
  );
}

/**
 * The Report/Complaint Inbox list - reports Investors and Business
 * Owners filed via their dashboard's "Report" tab. Session-gated fetch
 * (mirrors ApplicationsView.tsx): loads up to 100 reports plus every
 * member once, then all filtering/sorting happens client-side in a
 * useMemo - same convention as ApplicationsView, even though the backend
 * itself also supports server-side filter/sort query params.
 * `initialStatus` seeds the filter from the Overview page's own "Open
 * Reports" stat link (?status=open).
 */
export default function ReportsView({ initialStatus = "all" }: { initialStatus?: ReportStatus | "all" }) {
  const router = useRouter();
  const { session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<MemberTrack | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">(initialStatus);
  const [sortKey, setSortKey] = useState<SortKey>("triage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    Promise.all([getReports(), fetchMembers()]).then(([reportRows, memberRows]) => {
      if (cancelled) return;
      setReports(reportRows);
      setMembers(memberRows);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const membersById = useMemo(() => {
    return members.reduce<Record<string, Member>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [members]);

  const categoryOptions = useMemo(() => {
    const seen = Array.from(new Set(reports.map((r) => r.category))).sort();
    return [{ value: "all", label: "All Categories" }, ...seen.map((c) => ({ value: c, label: c }))];
  }, [reports]);

  function toggleSort(key: Exclude<SortKey, "triage">) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    return reports
      .filter((r) => roleFilter === "all" || membersById[r.memberId]?.track === roleFilter)
      .filter((r) => categoryFilter === "all" || r.category === categoryFilter)
      .filter((r) => priorityFilter === "all" || r.priority === priorityFilter)
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .sort((a, b) => compareReports(a, b, sortKey, sortDir));
  }, [reports, membersById, roleFilter, categoryFilter, priorityFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 font-sans text-sm text-cream-dim">
        <SpinnerIcon className="size-5 animate-spin" /> Loading reports…
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader title="Report / Complaint Inbox" description="Reports Investors and Business Owners have filed from their dashboard." />

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
        <Select
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v as MemberTrack | "all");
            setPage(1);
          }}
          options={ROLE_OPTIONS}
          ariaLabel="Filter by role"
        />
        <Select
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
          options={categoryOptions}
          ariaLabel="Filter by category"
        />
        <Select
          value={priorityFilter}
          onChange={(v) => {
            setPriorityFilter(v as ReportPriority | "all");
            setPage(1);
          }}
          options={PRIORITY_OPTIONS}
          ariaLabel="Filter by priority"
        />
        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as ReportStatus | "all");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by status"
        />

        <span className="mx-1 h-6 w-px shrink-0 bg-grid-line" />

        <SortButton label="Date" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
        <SortButton label="Priority" active={sortKey === "priority"} dir={sortDir} onClick={() => toggleSort("priority")} />

        <span className="font-sans text-xs text-cream-dim">
          {filtered.length} of {reports.length}
        </span>
      </motion.div>

      {filtered.length === 0 ? (
        reports.length === 0 ? (
          <EmptyState
            icon={BookIcon}
            title="No reports yet"
            description="Reports Investors and Business Owners file from their dashboard will show up here."
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="No reports match these filters"
            description="Try a different role, category, priority, or status."
            action={
              <button
                type="button"
                onClick={() => {
                  setRoleFilter("all");
                  setCategoryFilter("all");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
                className="border border-grid-line px-3 py-2 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
              >
                Clear filters
              </button>
            }
          />
        )
      ) : (
        <>
          <motion.div variants={staggerItem} className="hidden overflow-x-auto border border-grid-line lg:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-grid-line bg-panel/40">
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Reporter</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Role</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Category</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Subject</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Priority</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((report) => {
                  const member = membersById[report.memberId];
                  return (
                    <motion.tr
                      key={report.id}
                      {...hoverLift}
                      onClick={handleRowClick(router, `/reports/${report.id}`)}
                      className={`cursor-pointer border-b border-grid-line last:border-b-0 hover:bg-panel/30 ${
                        isUrgent(report) ? DANGER_ROW_CLASSNAME : ""
                      }`}
                    >
                      <td className="p-0">
                        <Link href={`/reports/${report.id}`} className="flex items-center gap-3 px-4 py-3">
                          <span className={AVATAR_CLASSNAME}>{(member?.nickname ?? "?").slice(0, 2).toUpperCase()}</span>
                          <span className="flex flex-col">
                            <span className="font-jakarta text-sm font-medium text-cream">{member?.nickname ?? "Unknown member"}</span>
                            <span className="font-sans text-xs text-cream-dim">{member?.realName}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-sans text-sm text-cream-dim">{member ? TRACK_LABEL[member.track] : "-"}</td>
                      <td className="px-4 py-3 font-sans text-sm text-cream-dim">{report.category}</td>
                      <td className="max-w-64 truncate px-4 py-3 font-sans text-sm text-cream-dim">{report.subject}</td>
                      <td className="px-4 py-3">
                        <PriorityTag label={PRIORITY_LABEL[report.priority]} tone={PRIORITY_TONE[report.priority]} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusDot label={STATUS_LABEL[report.status]} tone={STATUS_TONE[report.status]} />
                      </td>
                      <td className="px-4 py-3 font-sans text-sm text-cream-dim">{formatDisplayDate(report.submittedAt)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3 lg:hidden">
            {paginated.map((report) => {
              const member = membersById[report.memberId];
              return (
                <motion.div key={report.id} {...hoverLift}>
                  <Link
                    href={`/reports/${report.id}`}
                    className={`flex flex-col gap-2 border border-grid-line bg-panel/20 p-4 ${
                      isUrgent(report) ? DANGER_ROW_CLASSNAME : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={AVATAR_CLASSNAME}>{(member?.nickname ?? "?").slice(0, 2).toUpperCase()}</span>
                        <span className="flex flex-col">
                          <span className="font-jakarta text-sm font-semibold text-cream">{member?.nickname ?? "Unknown member"}</span>
                          <span className="font-sans text-xs text-cream-dim">{member?.realName}</span>
                        </span>
                      </div>
                      <StatusDot label={STATUS_LABEL[report.status]} tone={STATUS_TONE[report.status]} />
                    </div>
                    <span className="font-sans text-sm text-cream">{report.subject}</span>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cream-dim">
                      <span>
                        {member ? TRACK_LABEL[member.track] : "-"} · {report.category}
                      </span>
                      <PriorityTag label={PRIORITY_LABEL[report.priority]} tone={PRIORITY_TONE[report.priority]} />
                    </div>
                    <span className="font-sans text-xs text-cream-dim">Submitted {formatDisplayDate(report.submittedAt)}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
