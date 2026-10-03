"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { scrollReveal, hoverScale } from "@/lib/motion";
import { formatDisplayDate, formatGhs } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge, { type BadgeTone } from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import DocumentPreview from "@/components/admin/DocumentPreview";
import ListingForm, { type ListingFormValues } from "@/components/admin/listings/ListingForm";
import AdminBusinessEditForm from "@/components/admin/businesses/AdminBusinessEditForm";
import { ArrowRightIcon, PencilIcon, SpinnerIcon } from "@/components/icons";
import { useSession } from "@/lib/auth";
import {
  getBusinessById,
  updateAdminBusiness,
  type Business,
  type UpdateAdminBusinessInput,
} from "@/lib/businesses";
import { LISTING_STATUS_LABEL, getFundingPercent, updateBusinessListing, type ListingStatus } from "@/lib/businessListings";
import { ApiError } from "@/lib/api/client";

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

function ownerLabel(business: Business): string {
  return business.ownerType === "admin" ? "AUREX (Admin)" : (business.ownerMemberNickname ?? "-");
}

export default function BusinessDetailView({ id }: { id: string }) {
  const { session } = useSession();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getBusinessById(id).then((result) => {
      if (cancelled) return;
      setBusiness(result ?? null);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, id]);

  async function handleSaveAdminBusiness(values: UpdateAdminBusinessInput) {
    const updated = updateAdminBusiness(id, values);
    if (updated) {
      setBusiness(updated);
      setBanner(`${updated.name} updated.`);
    }
    setIsEditOpen(false);
  }

  async function handleSaveListing(values: ListingFormValues) {
    if (!business?.listing) return;
    try {
      const updated = await updateBusinessListing(business.listing.id, values);
      setBusiness((prev) => (prev ? { ...prev, name: updated.businessName, description: updated.description, listing: updated } : prev));
      setBanner(`${updated.businessName} updated.`);
      setIsEditOpen(false);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to update listing.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 font-sans text-sm text-cream-dim">
        <SpinnerIcon className="size-5 animate-spin" /> Loading business…
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-sans text-sm text-cream-dim">This business couldn&apos;t be found.</p>
        <Link href="/businesses" className="font-jakarta text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
          Back to businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/businesses" className="flex w-fit items-center gap-1.5 font-sans text-sm text-cream-dim transition-colors hover:text-gold-bright">
        <span className="rotate-180">
          <ArrowRightIcon className="size-3" />
        </span>
        Back to businesses
      </Link>

      <PageHeader
        title={business.name}
        description={ownerLabel(business)}
        action={
          business.listing ? (
            <StatusBadge label={LISTING_STATUS_LABEL[business.listing.status]} tone={LISTING_TONE[business.listing.status]} />
          ) : (
            <StatusBadge label="Not Listed" tone="neutral" />
          )
        }
      />

      {banner && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/30 bg-gold/5 p-4 font-sans text-sm text-cream-dim">
          {banner}
        </motion.div>
      )}

      <motion.section {...scrollReveal} className="flex flex-col gap-5 border border-grid-line bg-panel/20 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Business Details</h2>
          {business.source === "admin_added" && (
            <motion.button
              {...hoverScale}
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 border border-gold/30 px-3 py-1.5 font-jakarta text-xs font-medium text-gold-bright transition-colors hover:border-gold hover:bg-gold/5"
            >
              <PencilIcon className="size-3.5" /> Edit
            </motion.button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Business Name" value={business.name} />
          <Field label="Category" value={business.category || "-"} />
          <Field label="Owner" value={ownerLabel(business)} />
          <Field label="Added" value={business.createdAt ? formatDisplayDate(business.createdAt) : "-"} />
        </div>
        <Field label="Description" value={business.description || "-"} />
      </motion.section>

      {business.listing ? (
        <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-jakarta text-lg font-semibold text-cream">Funding & Status</h2>
            <motion.button
              {...hoverScale}
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 border border-gold/30 px-3 py-1.5 font-jakarta text-xs font-medium text-gold-bright transition-colors hover:border-gold hover:bg-gold/5"
            >
              <PencilIcon className="size-3.5" /> Edit
            </motion.button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Status" value={LISTING_STATUS_LABEL[business.listing.status]} />
            <Field label="Funding Goal" value={formatGhs(business.listing.fundingGoalGhs)} />
            <Field
              label="Raised"
              value={`${formatGhs(business.listing.amountRaisedGhs)} (${getFundingPercent(business.listing)}%)`}
            />
            <Field label="Backers" value={String(business.listing.backerCount)} />
          </div>
          <Field label="Funding Purpose" value={business.listing.fundingPurpose || "-"} />
          <p className="font-sans text-xs text-cream-dim">
            Status and funding goal come from the linked Ventures package. Edit those on the Slots page.
          </p>

          {business.listing.businessRegDocument && (
            <DocumentPreview
              label="Business Registration Certificate"
              fileName={business.listing.businessRegDocument.fileName}
              uploadedAt={business.listing.businessRegDocument.uploadedAt}
              url={business.listing.businessRegDocument.url}
            />
          )}
        </motion.section>
      ) : (
        <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Funding & Status</h2>
          <p className="font-sans text-sm text-cream-dim">
            Not listed for funding. Businesses get a public funding listing once they come through the Applications
            approval pipeline with a linked Ventures package.
          </p>
        </motion.section>
      )}

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${business.name}`}
        description={business.listing ? undefined : "Update this business's name, category, and description."}
      >
        {business.listing ? (
          <ListingForm listing={business.listing} onCancel={() => setIsEditOpen(false)} onSave={handleSaveListing} />
        ) : (
          <AdminBusinessEditForm business={business} onCancel={() => setIsEditOpen(false)} onSave={handleSaveAdminBusiness} />
        )}
      </Modal>
    </div>
  );
}
