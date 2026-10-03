"use client";

import { useState } from "react";
import { formatGhs } from "@/lib/formatters";
import { SpinnerIcon } from "@/components/icons";
import { LISTING_STATUS_LABEL, getFundingPercent, type BusinessListing } from "@/lib/businessListings";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

export type ListingFormValues = {
  description: string;
  fundingPurpose: string;
};

export default function ListingForm({
  listing,
  onCancel,
  onSave,
}: {
  listing: BusinessListing;
  onCancel: () => void;
  onSave: (values: ListingFormValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<ListingFormValues>({
    description: listing.description,
    fundingPurpose: listing.fundingPurpose,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
          await onSave(values);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-3 border border-grid-line bg-panel/40 px-3 py-2 font-sans text-xs text-cream-dim">
        <span>Status: {LISTING_STATUS_LABEL[listing.status]}</span>
        <span>
          Goal: {formatGhs(listing.fundingGoalGhs)} · Raised: {formatGhs(listing.amountRaisedGhs)} (
          {getFundingPercent(listing)}%)
        </span>
      </div>
      <p className="font-sans text-xs text-cream-dim">
        Status and funding goal come from the linked Ventures package. Edit those on the Slots page.
      </p>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Description</span>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Funding Purpose</span>
        <textarea
          value={values.fundingPurpose}
          onChange={(e) => set("fundingPurpose", e.target.value)}
          rows={2}
          className={INPUT_CLASSNAME}
        />
      </label>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-grid-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="font-sans text-sm text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
