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
import Select from "@/components/admin/Select";
import EmptyState from "@/components/admin/EmptyState";
import Pagination from "@/components/admin/Pagination";
import { AVATAR_CLASSNAME, DANGER_ROW_CLASSNAME, handleRowClick } from "@/components/admin/tableStyles";
import { ArrowUpIcon, ArrowDownIcon, InboxIcon, SearchIcon, SpinnerIcon } from "@/components/icons";
import { useSession } from "@/lib/auth";
import { getApplications, type Application, type ApplicationStatus, type ApplicationTrack } from "@/lib/applications";

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  pending: "neutral",
  approved: "gold",
  rejected: "danger",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const TRACK_LABEL: Record<ApplicationTrack, string> = {
  investor: "Investor",
  business: "Business Owner",
};

const TRACK_OPTIONS = [
  { value: "all", label: "All Tracks" },
  { value: "investor", label: "Investor" },
  { value: "business", label: "Business Owner" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 10;

/**
 * The Application Review Queue list. Filter/sort state lives here (client
 * component) since this is a live, interactive list - `applications` is
 * plain data passed down from the server page, `initialStatus` seeds the
 * filter from the Overview page's own "Pending Applications" stat link
 * (?status=pending), same query-param-as-stub-filter convention already
 * used elsewhere.
 */
export default function ApplicationsView({ initialStatus = "all" }: { initialStatus?: ApplicationStatus | "all" }) {
  const router = useRouter();
  const { session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState<ApplicationTrack | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(initialStatus);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getApplications().then((rows) => {
      if (!cancelled) {
        setApplications(rows);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filtered = useMemo(() => {
    return applications
      .filter((a) => trackFilter === "all" || a.track === trackFilter)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .sort((a, b) => {
        const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        return sortDir === "asc" ? diff : -diff;
      });
  }, [applications, trackFilter, statusFilter, sortDir]);

  // Clamp rather than reset-in-an-effect: keeps the current page as long
  // as it's still in range, and falls back to the last page once a
  // filter/sort change shrinks the result set past it.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader
        title="Application Review Queue"
        description="Review and decide on investor and business owner applications."
      />

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
        <Select
          value={trackFilter}
          onChange={(v) => {
            setTrackFilter(v as ApplicationTrack | "all");
            setPage(1);
          }}
          options={TRACK_OPTIONS}
          ariaLabel="Filter by track"
        />

        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as ApplicationStatus | "all");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by status"
        />

        <button
          type="button"
          onClick={() => {
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
            setPage(1);
          }}
          className="flex items-center gap-1.5 border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream-dim transition-colors hover:text-cream"
        >
          Date {sortDir === "desc" ? <ArrowDownIcon className="size-3" /> : <ArrowUpIcon className="size-3" />}
        </button>

        <span className="font-sans text-xs text-cream-dim">
          {filtered.length} of {applications.length}
        </span>
      </motion.div>

      {isLoading ? (
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-2 border border-grid-line bg-panel/20 p-8 font-sans text-sm text-cream-dim"
        >
          <SpinnerIcon className="size-4 animate-spin" /> Loading applications…
        </motion.div>
      ) : filtered.length === 0 ? (
        applications.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="No applications yet"
            description="Investor and business owner applications will show up here as soon as people start applying."
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="No applications match these filters"
            description="Try a different track or status."
            action={
              <button
                type="button"
                onClick={() => {
                  setTrackFilter("all");
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
          {/* lg+: real table. Below lg: stacked cards - a table this
              narrow (5 columns of real content) stops reflowing sensibly
              well before "mobile", so the breakpoint is lg, not sm. */}
          <motion.div variants={staggerItem} className="hidden overflow-x-auto border border-grid-line lg:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-grid-line bg-panel/40">
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Nickname</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Real Name</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Track</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Submitted</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((application) => (
                  <motion.tr
                    key={application.id}
                    {...hoverLift}
                    onClick={handleRowClick(router, `/applications/${application.id}`)}
                    className={`cursor-pointer border-b border-grid-line last:border-b-0 hover:bg-panel/30 ${
                      application.status === "rejected" ? DANGER_ROW_CLASSNAME : ""
                    }`}
                  >
                    <td className="p-0">
                      <Link href={`/applications/${application.id}`} className="flex items-center gap-3 px-4 py-3">
                        <span className={AVATAR_CLASSNAME}>{application.nickname.slice(0, 2).toUpperCase()}</span>
                        <span className="font-jakarta text-sm font-medium text-cream">{application.nickname}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-cream-dim">{application.realName}</td>
                    <td className="px-4 py-3 font-sans text-sm text-cream-dim">{TRACK_LABEL[application.track]}</td>
                    <td className="px-4 py-3 font-sans text-sm text-cream-dim">{formatDisplayDate(application.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <StatusDot label={STATUS_LABEL[application.status]} tone={STATUS_TONE[application.status]} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3 lg:hidden">
            {paginated.map((application) => (
              <motion.div key={application.id} {...hoverLift}>
                <Link
                  href={`/applications/${application.id}`}
                  className={`flex flex-col gap-2 border border-grid-line bg-panel/20 p-4 ${
                    application.status === "rejected" ? DANGER_ROW_CLASSNAME : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={AVATAR_CLASSNAME}>{application.nickname.slice(0, 2).toUpperCase()}</span>
                      <span className="font-jakarta text-sm font-semibold text-cream">{application.nickname}</span>
                    </div>
                    <StatusDot label={STATUS_LABEL[application.status]} tone={STATUS_TONE[application.status]} />
                  </div>
                  <span className="font-sans text-sm text-cream-dim">{application.realName}</span>
                  <div className="flex items-center justify-between gap-3 text-xs text-cream-dim">
                    <span>{TRACK_LABEL[application.track]}</span>
                    <span>{formatDisplayDate(application.submittedAt)}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
