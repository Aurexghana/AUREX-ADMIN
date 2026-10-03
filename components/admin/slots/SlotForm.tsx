"use client";

import { useState } from "react";
import Select from "@/components/admin/Select";
import DatePicker from "@/components/admin/DatePicker";
import { SpinnerIcon } from "@/components/icons";
import type { ApprovedBusiness } from "@/lib/businesses";
import type { InvestmentSlot, PayoutFrequency, SlotPackage } from "@/lib/packages";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

const PAYOUT_FREQUENCY_OPTIONS: { value: PayoutFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "at_maturity", label: "At Maturity" },
];

export type SlotFormValues = {
  name: string;
  package: SlotPackage;
  businessId: string;
  minInvestmentGhs: string;
  maxInvestmentGhs: string;
  fundLimitGhs: string;
  roiRatePercent: string;
  termMonths: string;
  payoutFrequency: PayoutFrequency;
  opensAt: string;
  closesAt: string;
};

function toFormValues(slot?: InvestmentSlot): SlotFormValues {
  return {
    name: slot?.name ?? "",
    package: slot?.package ?? "core",
    businessId: slot?.businessId ?? "",
    minInvestmentGhs: slot ? String(slot.minInvestmentGhs) : "",
    maxInvestmentGhs: slot ? String(slot.maxInvestmentGhs) : "",
    fundLimitGhs: slot?.fundLimitGhs !== undefined ? String(slot.fundLimitGhs) : "",
    roiRatePercent: slot ? String(slot.roiRate) : "",
    termMonths: slot ? String(slot.termMonths) : "",
    payoutFrequency: slot?.payoutFrequency ?? "monthly",
    opensAt: slot?.opensAt ?? "",
    closesAt: slot?.closesAt ?? "",
  };
}

export default function SlotForm({
  slot,
  approvedBusinesses,
  onCancel,
  onSaveDraft,
  onPublish,
  publishError,
}: {
  slot?: InvestmentSlot;
  approvedBusinesses: ApprovedBusiness[];
  onCancel: () => void;
  onSaveDraft: (values: SlotFormValues) => void | Promise<void>;
  onPublish: (values: SlotFormValues) => void | Promise<void>;
  publishError?: string;
}) {
  const [values, setValues] = useState<SlotFormValues>(() => toFormValues(slot));
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | null>(null);
  const isPending = pendingAction !== null;

  function set<K extends keyof SlotFormValues>(key: K, value: SlotFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSaveDraft() {
    setPendingAction("draft");
    try {
      await onSaveDraft(values);
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePublish() {
    setPendingAction("publish");
    try {
      await onPublish(values);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Slot Name</span>
        <input
          type="text"
          required
          maxLength={200}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. AUREX Core Pool 3"
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Package Type</span>
        <Select
          value={values.package}
          onChange={(v) => set("package", v as SlotPackage)}
          options={[
            { value: "core", label: "AUREX Core" },
            { value: "ventures", label: "AUREX Ventures" },
          ]}
        />
      </label>

      {values.package === "ventures" && (
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Linked Business (approved businesses only)</span>
          <Select
            value={values.businessId}
            onChange={(v) => set("businessId", v)}
            options={[
              { value: "", label: "Select a business" },
              ...approvedBusinesses.map((business) => ({ value: business.id, label: business.name })),
            ]}
          />
        </label>
      )}

      {values.package === "ventures" && (
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Funding Goal (GHS) — shown on the business&apos;s public listing</span>
          <input
            type="number"
            min={0}
            value={values.fundLimitGhs}
            onChange={(e) => set("fundLimitGhs", e.target.value)}
            placeholder="e.g. 50000"
            className={INPUT_CLASSNAME}
          />
        </label>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Minimum Investment (GHS)</span>
          <input
            type="number"
            min={0}
            value={values.minInvestmentGhs}
            onChange={(e) => set("minInvestmentGhs", e.target.value)}
            placeholder="e.g. 2000"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Maximum Investment (GHS)</span>
          <input
            type="number"
            min={0}
            value={values.maxInvestmentGhs}
            onChange={(e) => set("maxInvestmentGhs", e.target.value)}
            placeholder="e.g. 50000"
            className={INPUT_CLASSNAME}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Interest Rate (% p.a.)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.roiRatePercent}
            onChange={(e) => set("roiRatePercent", e.target.value)}
            placeholder="e.g. 14"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Term (months)</span>
          <input
            type="number"
            min={1}
            value={values.termMonths}
            onChange={(e) => set("termMonths", e.target.value)}
            placeholder="e.g. 12"
            className={INPUT_CLASSNAME}
          />
        </label>
      </div>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Payout Frequency</span>
        <Select
          value={values.payoutFrequency}
          onChange={(v) => set("payoutFrequency", v as PayoutFrequency)}
          options={PAYOUT_FREQUENCY_OPTIONS}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Opens</span>
          <DatePicker value={values.opensAt} onChange={(v) => set("opensAt", v)} ariaLabel="Opens on" />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Closes</span>
          <DatePicker value={values.closesAt} onChange={(v) => set("closesAt", v)} ariaLabel="Closes on" />
        </label>
      </div>

      {publishError && <p className="font-sans text-sm text-[#f87171]">{publishError}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-grid-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="font-sans text-sm text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isPending}
          className="border border-gold/30 px-4 py-2 font-jakarta text-sm font-medium text-gold-bright transition-colors hover:border-gold hover:bg-gold/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "draft" ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPending}
          className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "publish" ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Publish"}
        </button>
      </div>
    </form>
  );
}
