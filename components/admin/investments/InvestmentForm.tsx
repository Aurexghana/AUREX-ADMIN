"use client";

import { useState } from "react";
import { hoverScale } from "@/lib/motion";
import { motion } from "framer-motion";
import { SpinnerIcon, UploadIcon } from "@/components/icons";
import Select from "@/components/admin/Select";
import ComboSelect from "@/components/admin/ComboSelect";
import DatePicker from "@/components/admin/DatePicker";
import type { InvestmentSlot } from "@/lib/packages";
import type { Member } from "@/lib/members";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Select a method" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cash", label: "Cash" },
];

export type InvestmentFormValues = {
  memberId: string;
  packageId: string;
  amountInvestedGhs: string;
  dateInvested: string;
  method: "bank_transfer" | "mobile_money" | "cash" | "";
  reference: string;
  proofOfPayment: File | null;
  notes: string;
};

const EMPTY_VALUES: InvestmentFormValues = {
  memberId: "",
  packageId: "",
  amountInvestedGhs: "",
  dateInvested: "",
  method: "",
  reference: "",
  proofOfPayment: null,
  notes: "",
};

export default function InvestmentForm({
  investors,
  openSlots,
  onSubmit,
}: {
  investors: Member[];
  openSlots: InvestmentSlot[];
  onSubmit: (values: InvestmentFormValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<InvestmentFormValues>(EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof InvestmentFormValues>(key: K, value: InvestmentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const canSubmit =
    values.memberId &&
    values.packageId &&
    Number(values.amountInvestedGhs) > 0 &&
    values.dateInvested &&
    values.method &&
    !isSubmitting;

  return (
    <form
      className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
          await onSubmit(values);
          setValues(EMPTY_VALUES);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <h2 className="font-jakarta text-lg font-semibold text-cream">Record an Investment</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Member</span>
          <ComboSelect
            value={values.memberId}
            onChange={(v) => set("memberId", v)}
            options={investors.map((m) => ({ value: m.id, label: m.nickname }))}
            placeholder="Select an investor"
            searchPlaceholder="Search investors..."
            ariaLabel="Member"
          />
        </label>

        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Slot / Package</span>
          <ComboSelect
            value={values.packageId}
            onChange={(v) => set("packageId", v)}
            options={openSlots.map((s) => ({ value: s.id, label: `${s.name} (${s.ratePercentLabel})` }))}
            placeholder="Select an open slot"
            searchPlaceholder="Search slots..."
            ariaLabel="Slot / Package"
          />
        </label>

        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Amount Invested (GHS)</span>
          <input
            type="number"
            min={0}
            value={values.amountInvestedGhs}
            onChange={(e) => set("amountInvestedGhs", e.target.value)}
            placeholder="e.g. 5000"
            className={INPUT_CLASSNAME}
          />
        </label>

        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Date Invested</span>
          <DatePicker value={values.dateInvested} onChange={(v) => set("dateInvested", v)} ariaLabel="Date invested" />
        </label>

        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Payment Method</span>
          <Select
            value={values.method}
            onChange={(v) => set("method", v as InvestmentFormValues["method"])}
            options={PAYMENT_METHOD_OPTIONS}
          />
        </label>

        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Reference (optional)</span>
          <input
            type="text"
            value={values.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="e.g. bank transfer reference"
            className={INPUT_CLASSNAME}
          />
        </label>
      </div>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Proof of Payment (optional)</span>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 border border-grid-line px-3 py-2 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream">
            <UploadIcon className="size-3.5" />
            Choose File
            <input
              type="file"
              className="sr-only"
              onChange={(e) => set("proofOfPayment", e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="truncate font-sans text-xs text-cream-dim">{values.proofOfPayment?.name ?? "No file selected"}</span>
        </div>
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Notes (optional)</span>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="e.g. Top-up into existing Ventures slot"
          className={INPUT_CLASSNAME}
        />
      </label>

      <div>
        <motion.button
          {...hoverScale}
          type="submit"
          disabled={!canSubmit}
          className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Record Investment"}
        </motion.button>
      </div>
    </form>
  );
}
