"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { scrollReveal, hoverScale } from "@/lib/motion";
import { formatDisplayDate, formatGhs } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge, { type BadgeTone } from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ArrowRightIcon, SpinnerIcon } from "@/components/icons";
import { useSession } from "@/lib/auth";
import { fetchMemberById, type Member, type MemberStatus } from "@/lib/members";
import { fetchInvestments, type InvestmentRecord } from "@/lib/investments";
import {
  fetchBusinessListings,
  LISTING_STATUS_LABEL,
  getFundingPercent,
  type BusinessListing,
  type ListingStatus,
} from "@/lib/businessListings";

const STATUS_TONE: Record<MemberStatus, BadgeTone> = { active: "gold", suspended: "danger" };
const LISTING_TONE: Record<ListingStatus, BadgeTone> = {
  pending: "neutral",
  live: "gold",
  funded: "success",
  closed: "danger",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
      <p className="font-sans text-sm text-cream">{value}</p>
    </div>
  );
}

function slotLabel(record: InvestmentRecord) {
  return record.businessName ?? record.packageName;
}

export default function MemberDetailView({ id }: { id: string }) {
  const { session } = useSession();
  const [member, setMember] = useState<Member | null>(null);
  const [investmentRecords, setInvestmentRecords] = useState<InvestmentRecord[]>([]);
  const [listing, setListing] = useState<BusinessListing | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<MemberStatus>("active");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchMemberById(id).then((result) => {
      if (cancelled) return;
      setMember(result ?? null);
      setStatus(result?.status ?? "active");
      setIsLoading(false);
      if (result?.track === "investor") {
        fetchInvestments({ memberId: result.id }).then((records) => {
          if (!cancelled) setInvestmentRecords(records);
        });
      } else if (result?.track === "business") {
        fetchBusinessListings().then((listings) => {
          if (!cancelled) setListing(listings.find((l) => l.ownerNickname === result.nickname));
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, id]);

  const totalInvested = investmentRecords.reduce((sum, r) => sum + r.amountInvestedGhs, 0);

  function toggleStatus() {
    if (!member) return;
    const next: MemberStatus = status === "active" ? "suspended" : "active";
    setStatus(next);
    setActionMessage(
      `${member.nickname} was ${next === "suspended" ? "suspended" : "reactivated"}. Stubbed: nothing is persisted (no backend yet).`
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 font-sans text-sm text-cream-dim">
        <SpinnerIcon className="size-5 animate-spin" /> Loading member…
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-sans text-sm text-cream-dim">This member couldn&apos;t be found.</p>
        <Link href="/members" className="font-jakarta text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
          Back to members
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/members" className="flex w-fit items-center gap-1.5 font-sans text-sm text-cream-dim transition-colors hover:text-gold-bright">
        <span className="rotate-180"><ArrowRightIcon className="size-3" /></span>
        Back to members
      </Link>

      <PageHeader
        title={member.nickname}
        description={member.track === "investor" ? "Investor" : "Business Owner"}
        action={<StatusBadge label={status === "active" ? "Active" : "Suspended"} tone={STATUS_TONE[status]} />}
      />

      {actionMessage && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/30 bg-gold/5 p-4 font-sans text-sm text-cream-dim">
          {actionMessage}
        </motion.div>
      )}

      <motion.section {...scrollReveal} className="flex flex-col gap-5 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Account Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nickname" value={member.nickname} />
          <Field label="Full Name" value={member.realName} />
          <Field label="Email" value={member.email} />
          <Field label="Phone" value={member.phone} />
          <Field label="Country" value={member.country} />
          <Field label="Joined" value={formatDisplayDate(member.joinDate)} />
        </div>
      </motion.section>

      {member.track === "investor" ? (
        <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-jakarta text-lg font-semibold text-cream">Investment History</h2>
            <span className="font-jakarta text-sm font-semibold text-gold-bright">{formatGhs(totalInvested)} total</span>
          </div>

          {investmentRecords.length === 0 ? (
            <p className="font-sans text-sm text-cream-dim">No investments recorded yet.</p>
          ) : (
            <div className="flex flex-col">
              {investmentRecords.map((record) => (
                <div key={record.id} className="flex flex-col gap-1 border-b border-grid-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-jakarta text-sm font-medium text-cream">{slotLabel(record)}</span>
                    <span className="font-sans text-xs text-cream-dim">
                      Invested {formatDisplayDate(record.dateInvested)} · Earnings to date {formatGhs(record.earningsToDateGhs)}
                    </span>
                  </div>
                  <span className="font-jakarta text-sm font-semibold text-gold-bright">{formatGhs(record.amountInvestedGhs)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      ) : (
        <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Listing Status</h2>
          {listing ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-jakarta text-base font-semibold text-cream">{listing.businessName}</span>
                <StatusBadge label={LISTING_STATUS_LABEL[listing.status]} tone={LISTING_TONE[listing.status]} />
              </div>
              <p className="font-sans text-sm text-cream-dim">
                {formatGhs(listing.amountRaisedGhs)} raised of {formatGhs(listing.fundingGoalGhs)} goal ({getFundingPercent(listing)}%) ·{" "}
                {listing.backerCount} backers
              </p>
              <Link
                href={`/businesses/${listing.id}`}
                className="flex w-fit items-center gap-1.5 font-jakarta text-sm font-medium text-gold-bright underline-offset-4 transition-colors hover:text-gold-light hover:underline"
              >
                View Listing
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          ) : (
            <p className="font-sans text-sm text-cream-dim">No listing on file for this member.</p>
          )}
        </motion.section>
      )}

      <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Account Action</h2>
        <div>
          <motion.button
            {...hoverScale}
            type="button"
            onClick={() => setConfirmToggleOpen(true)}
            className={
              status === "active"
                ? "flex items-center gap-1.5 border border-[#f87171]/30 px-5 py-2.5 font-jakarta text-sm font-medium text-[#f87171] transition-colors hover:border-[#f87171] hover:bg-[#f87171]/10"
                : "flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack"
            }
          >
            {status === "active" ? "Suspend Member" : "Reactivate Member"}
          </motion.button>
        </div>
      </motion.section>

      <ConfirmDialog
        isOpen={confirmToggleOpen}
        onClose={() => setConfirmToggleOpen(false)}
        onConfirm={toggleStatus}
        title={status === "active" ? "Suspend this member?" : "Reactivate this member?"}
        description={
          status === "active"
            ? `${member.nickname} will lose access to the platform until reactivated.`
            : `${member.nickname} will regain full access to the platform.`
        }
        confirmLabel={status === "active" ? "Suspend" : "Reactivate"}
        tone={status === "active" ? "danger" : "gold"}
      />
    </div>
  );
}
