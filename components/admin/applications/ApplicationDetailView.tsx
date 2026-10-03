"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { scrollReveal, hoverScale } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge, { type BadgeTone } from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DocumentPreview from "@/components/admin/DocumentPreview";
import { ArrowRightIcon, CheckIcon, MailIcon, SpinnerIcon, XIcon } from "@/components/icons";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";
import {
  approveApplication,
  formatFundingRange,
  getApplicationById,
  rejectApplication,
  resendApplicationActivation,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
      <p className="font-sans text-sm text-cream">{value}</p>
    </div>
  );
}

/**
 * The Application detail/review screen. Fetches its own data (see
 * ApplicationsView's own comment for why this can't be a server-fetched
 * prop) - `id` is all the parent route needs to pass down.
 *
 * `scrollReveal` on each section rather than one big fade-in - this is
 * the one admin screen genuinely long enough (personal info + business
 * info + two documents + actions) to benefit from content revealing as
 * you scroll, per the brief's own guidance for "detail views with lots
 * of content".
 */
export default function ApplicationDetailView({ id }: { id: string }) {
  const { session } = useSession();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<ApplicationStatus>("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getApplicationById(id).then((result) => {
      if (cancelled) return;
      setApplication(result ?? null);
      setStatus(result?.status ?? "pending");
      setRejectionReason(result?.rejectionReason ?? "");
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, id]);

  const isDecided = status !== "pending";

  async function handleApprove() {
    if (!application || !session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await approveApplication(application.id);
      setStatus("approved");
      setShowRejectForm(false);
      setActionFailed(false);
      setActionMessage(`${application.nickname}'s application was approved.`);
    } catch (err) {
      setActionFailed(true);
      setActionMessage(err instanceof ApiError ? `Couldn't approve this application: ${err.message}` : "Something went wrong approving this application.");
    } finally {
      setIsSubmitting(false);
      setConfirmApproveOpen(false);
    }
  }

  async function handleReject() {
    if (!application || !session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await rejectApplication(application.id, rejectionReason || undefined);
      setStatus("rejected");
      setShowRejectForm(false);
      setActionFailed(false);
      setActionMessage(`${application.nickname}'s application was rejected${rejectionReason ? ` ("${rejectionReason}")` : ""}.`);
    } catch (err) {
      setActionFailed(true);
      setActionMessage(err instanceof ApiError ? `Couldn't reject this application: ${err.message}` : "Something went wrong rejecting this application.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendActivation() {
    if (!application || !session || isResending) return;
    setIsResending(true);
    try {
      await resendApplicationActivation(application.id);
      setActionFailed(false);
      setActionMessage(`Activation link resent to ${application.nickname}.`);
    } catch (err) {
      setActionFailed(true);
      setActionMessage(
        err instanceof ApiError ? `Couldn't resend the activation link: ${err.message}` : "Something went wrong resending the activation link.",
      );
    } finally {
      setIsResending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 font-sans text-sm text-cream-dim">
        <SpinnerIcon className="size-5 animate-spin" /> Loading application…
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-sans text-sm text-cream-dim">This application couldn&apos;t be found.</p>
        <Link href="/applications" className="font-jakarta text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/applications" className="flex w-fit items-center gap-1.5 font-sans text-sm text-cream-dim transition-colors hover:text-gold-bright">
        <span className="rotate-180"><ArrowRightIcon className="size-3" /></span>
        Back to queue
      </Link>

      <PageHeader
        title={application.nickname}
        description={`${application.track === "investor" ? "Investor" : "Business Owner"} application`}
        action={<StatusBadge label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />}
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
        <h2 className="font-jakarta text-lg font-semibold text-cream">Applicant Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nickname" value={application.nickname} />
          <Field label="Full Name" value={application.realName} />
          <Field label="Email" value={application.email} />
          <Field label="Phone" value={application.phone} />
          <Field label="Country" value={application.country} />
          <Field label="Submitted" value={formatDisplayDate(application.submittedAt)} />
        </div>
      </motion.section>

      {application.track === "business" && (
        <motion.section {...scrollReveal} className="flex flex-col gap-5 border border-grid-line bg-panel/20 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Business Details</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Business Name" value={application.businessName ?? "-"} />
            <Field label="Funding Range" value={formatFundingRange(application.fundingRange)} />
          </div>
          <Field label="Description" value={application.businessDescription ?? "-"} />
        </motion.section>
      )}

      {(application.idDocument || application.businessRegDocument) && (
        <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Documents</h2>
          <div className="flex flex-col gap-3">
            {application.idDocument && (
              <DocumentPreview
                label="Government ID"
                fileName={application.idDocument.fileName}
                uploadedAt={application.idDocument.uploadedAt}
                url={application.idDocument.url}
              />
            )}
            {application.businessRegDocument && (
              <DocumentPreview
                label="Business Registration Certificate"
                fileName={application.businessRegDocument.fileName}
                uploadedAt={application.businessRegDocument.uploadedAt}
                url={application.businessRegDocument.url}
              />
            )}
          </div>
        </motion.section>
      )}

      <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Decision</h2>

        {status === "rejected" && rejectionReason && (
          <p className="font-sans text-sm text-cream-dim">
            <span className="text-[#f87171]">Rejection reason:</span> {rejectionReason}
          </p>
        )}

        {!isDecided && !showRejectForm && (
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              {...(isSubmitting ? {} : hoverScale)}
              type="button"
              onClick={() => setConfirmApproveOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <SpinnerIcon className="size-3.5 animate-spin" /> : (
                <>
                  <CheckIcon className="size-3.5" /> Approve
                </>
              )}
            </motion.button>
            <motion.button
              {...(isSubmitting ? {} : hoverScale)}
              type="button"
              onClick={() => setShowRejectForm(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 border border-[#f87171]/30 px-5 py-2.5 font-jakarta text-sm font-medium text-[#f87171] transition-colors hover:border-[#f87171] hover:bg-[#f87171]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XIcon className="size-3.5" /> Reject
            </motion.button>
          </div>
        )}

        {!isDecided && showRejectForm && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">Reason (optional)</span>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. ID document image unreadable"
                className="border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                {...(isSubmitting ? {} : hoverScale)}
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 border border-[#f87171]/30 px-5 py-2.5 font-jakarta text-sm font-medium text-[#f87171] transition-colors hover:border-[#f87171] hover:bg-[#f87171]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <SpinnerIcon className="size-3.5 animate-spin" /> : (
                  <>
                    <XIcon className="size-3.5" /> Confirm Rejection
                  </>
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                disabled={isSubmitting}
                className="font-sans text-sm text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isDecided && status === "approved" && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-sans text-sm text-cream-dim">This application has already been approved.</p>
            <motion.button
              {...(isResending ? {} : hoverScale)}
              type="button"
              onClick={handleResendActivation}
              disabled={isResending}
              className="flex items-center gap-1.5 border border-gold/30 px-5 py-2.5 font-jakarta text-sm font-medium text-gold-bright transition-colors hover:border-gold/60 hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? <SpinnerIcon className="size-3.5 animate-spin" /> : (
                <>
                  <MailIcon className="size-3.5" /> Resend confirmation link
                </>
              )}
            </motion.button>
          </div>
        )}

        {isDecided && status === "rejected" && (
          <p className="font-sans text-sm text-cream-dim">
            This application has already been rejected.
          </p>
        )}
      </motion.section>

      <ConfirmDialog
        isOpen={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        onConfirm={handleApprove}
        title="Approve this application?"
        description={`${application.nickname} will be admitted to the platform as ${
          application.track === "investor" ? "an investor" : "a business owner"
        }.`}
        confirmLabel="Approve"
        tone="gold"
      />
    </div>
  );
}
