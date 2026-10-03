"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { scrollReveal, hoverScale } from "@/lib/motion";
import { formatDisplayDate, buildWhatsAppLink } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge, { type BadgeTone } from "@/components/admin/StatusBadge";
import Select from "@/components/admin/Select";
import DocumentPreview from "@/components/admin/DocumentPreview";
import { ArrowRightIcon, ChatIcon, SpinnerIcon } from "@/components/icons";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";
import {
  getReportById,
  respondToReport,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Report,
  type ReportPriority,
  type ReportStatus,
} from "@/lib/reports";
import { fetchMemberById, type Member, type MemberTrack } from "@/lib/members";

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

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ReportStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
      <p className="font-sans text-sm text-cream">{value}</p>
    </div>
  );
}

/**
 * The Report detail/response screen. Fetches its own data (mirrors
 * ApplicationDetailView.tsx) - `id` is all the parent route needs to pass
 * down. The "related record" is shown as a plain label rather than a
 * clickable link into the investment/listing it names: the backend only
 * snapshots that label as text (see reports.table.ts's own comment), since
 * there's no admin-facing investments/listings lookup endpoint to
 * re-resolve a live link against.
 */
export default function ReportDetailView({ id }: { id: string }) {
  const { session } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [member, setMember] = useState<Member | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<ReportStatus>("open");
  const [response, setResponse] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getReportById(id).then(async (result) => {
      if (cancelled) return;
      setReport(result ?? null);
      setStatus(result?.status ?? "open");
      setResponse(result?.adminResponse ?? "");
      if (result) {
        const memberResult = await fetchMemberById(result.memberId);
        if (!cancelled) setMember(memberResult);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, id]);

  async function handleSave() {
    if (!report || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await respondToReport(report.id, status, response.trim() || undefined);
      setReport(updated);
      setStatus(updated.status);
      setActionFailed(false);
      setActionMessage(
        `Status set to "${STATUS_LABEL[updated.status]}"${response.trim() ? " and your response was saved" : ""}, visible to ${
          member?.nickname ?? "the reporter"
        } in their My Reports view.`,
      );
    } catch (err) {
      setActionFailed(true);
      setActionMessage(err instanceof ApiError ? `Couldn't save this report: ${err.message}` : "Something went wrong saving this report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const whatsAppHref = member
    ? buildWhatsAppLink(member.phone, `Hi ${member.nickname}, this is AUREX Admin regarding your report "${report?.subject ?? ""}".`)
    : undefined;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 font-sans text-sm text-cream-dim">
        <SpinnerIcon className="size-5 animate-spin" /> Loading report…
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-sans text-sm text-cream-dim">This report couldn&apos;t be found.</p>
        <Link href="/reports" className="font-jakarta text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
          Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/reports" className="flex w-fit items-center gap-1.5 font-sans text-sm text-cream-dim transition-colors hover:text-gold-bright">
        <span className="rotate-180">
          <ArrowRightIcon className="size-3" />
        </span>
        Back to inbox
      </Link>

      <PageHeader
        title={report.subject}
        description={`${report.category} · Submitted ${formatDisplayDate(report.submittedAt)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={PRIORITY_LABEL[report.priority]} tone={PRIORITY_TONE[report.priority]} />
            <StatusBadge label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />
          </div>
        }
      />

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            actionFailed
              ? "border border-[#f87171]/30 bg-[#f87171]/5 p-4 font-sans text-sm text-[#f87171]"
              : "border border-gold/30 bg-gold/5 p-4 font-sans text-sm text-cream-dim"
          }
        >
          {actionMessage}
        </motion.div>
      )}

      <motion.section {...scrollReveal} className="flex flex-col gap-5 border border-grid-line bg-panel/20 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Reporter</h2>
          {whatsAppHref && (
            <motion.a
              {...hoverScale}
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-gold/30 px-3 py-1.5 font-jakarta text-xs font-medium text-gold-bright transition-colors hover:border-gold hover:bg-gold/5"
            >
              <ChatIcon className="size-3.5" /> Contact via WhatsApp
            </motion.a>
          )}
        </div>
        {member ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nickname" value={member.nickname} />
            <Field label="Full Name" value={member.realName} />
            <Field label="Role" value={TRACK_LABEL[member.track]} />
            <Field label="Email" value={member.email} />
            <Field label="Phone" value={member.phone} />
            <Field label="Country" value={member.country} />
          </div>
        ) : (
          <p className="font-sans text-sm text-cream-dim">This member&rsquo;s account could no longer be found.</p>
        )}
        {member && (
          <Link
            href={`/members/${member.id}`}
            className="flex w-fit items-center gap-1.5 font-jakarta text-sm font-medium text-gold-bright underline-offset-4 transition-colors hover:text-gold-light hover:underline"
          >
            View Member Profile
            <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </motion.section>

      <motion.section {...scrollReveal} className="flex flex-col gap-5 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Report Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Category" value={report.category} />
          <Field label="Priority" value={PRIORITY_LABEL[report.priority]} />
          <Field label="Subject" value={report.subject} />
        </div>
        <Field label="Description" value={report.description} />

        <div className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">Related Record</span>
          <p className="font-sans text-sm text-cream-dim">{report.relatedRecordLabel ?? "Not related to a specific record"}</p>
        </div>
      </motion.section>

      {report.attachment && (
        <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Attachment</h2>
          <DocumentPreview
            label="Submitted Attachment"
            fileName={report.attachment.fileName}
            uploadedAt={report.attachment.uploadedAt}
            url={report.attachment.url}
          />
        </motion.section>
      )}

      <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Status &amp; Response</h2>

        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">Status</span>
          <Select value={status} onChange={(v) => setStatus(v as ReportStatus)} options={STATUS_OPTIONS} ariaLabel="Report status" triggerClassName="max-w-xs" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">Admin Response</span>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            placeholder="Reply visible to the reporter in their My Reports view…"
            className="border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none"
          />
        </label>

        {report.respondedAt && (
          <p className="font-sans text-xs text-cream-dim">Last responded {formatDisplayDate(report.respondedAt)}.</p>
        )}

        <div>
          <motion.button
            {...(isSubmitting ? {} : hoverScale)}
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <SpinnerIcon className="size-3.5 animate-spin" /> : "Save"}
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
}
