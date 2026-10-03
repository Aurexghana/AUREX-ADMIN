"use client";

import { useState } from "react";
import { hoverScale } from "@/lib/motion";
import { motion } from "framer-motion";
import { SpinnerIcon } from "@/components/icons";
import ComboSelect from "@/components/admin/ComboSelect";
import { getCountryList } from "@/lib/countries";
import type { NewInvestorInput } from "@/lib/members";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

export type MemberFormValues = {
  nickname: string;
  realName: string;
  email: string;
  phone: string;
  country: string;
};

const EMPTY_VALUES: MemberFormValues = {
  nickname: "",
  realName: "",
  email: "",
  phone: "",
  country: "",
};

/** Registers a new investor directly — same fields as the "New Member"
 *  branch of the Add Business flow (components/admin/businesses/BusinessForm.tsx),
 *  but standalone: this doesn't require a business to go with it. */
export default function MemberForm({
  onSubmit,
}: {
  onSubmit: (values: NewInvestorInput) => void | Promise<void>;
}) {
  const [values, setValues] = useState<MemberFormValues>(EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countryOptions = getCountryList().map((c) => ({ value: c.code, label: c.name }));

  function set<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const canSubmit =
    values.nickname.length >= 3 &&
    values.realName !== "" &&
    values.email !== "" &&
    values.phone !== "" &&
    values.country !== "" &&
    !isSubmitting;

  return (
    <form
      className="flex flex-col gap-4"
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Nickname</span>
          <input
            type="text"
            value={values.nickname}
            onChange={(e) => set("nickname", e.target.value)}
            placeholder="e.g. IronVault"
            minLength={3}
            maxLength={20}
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Real Name</span>
          <input
            type="text"
            value={values.realName}
            onChange={(e) => set("realName", e.target.value)}
            placeholder="e.g. Kwame Mensah"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="e.g. kwame.mensah@example.com"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Phone</span>
          <input
            type="text"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="e.g. +233 24 111 2222"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={`${LABEL_CLASSNAME} sm:col-span-2`}>
          <span className={LABEL_TEXT_CLASSNAME}>Country</span>
          <ComboSelect
            value={values.country}
            onChange={(v) => set("country", v)}
            options={countryOptions}
            placeholder="Select a country"
            searchPlaceholder="Search countries…"
            ariaLabel="Country"
          />
        </label>
      </div>

      <div>
        <motion.button
          {...hoverScale}
          type="submit"
          disabled={!canSubmit}
          className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Add Investor"}
        </motion.button>
      </div>
    </form>
  );
}
