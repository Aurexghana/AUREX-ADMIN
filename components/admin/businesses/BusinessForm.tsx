"use client";

import { useState } from "react";
import { hoverScale } from "@/lib/motion";
import { motion } from "framer-motion";
import { SpinnerIcon } from "@/components/icons";
import Select from "@/components/admin/Select";
import ComboSelect from "@/components/admin/ComboSelect";
import { getCountryList } from "@/lib/countries";
import { FUNDING_AMOUNT_OPTIONS, type CreateBusinessInput } from "@/lib/businesses";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

type BusinessFormValues = {
  name: string;
  description: string;
  fundingAmount: string;
  ownerNickname: string;
  ownerRealName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCountry: string;
};

const EMPTY_VALUES: BusinessFormValues = {
  name: "",
  description: "",
  fundingAmount: "",
  ownerNickname: "",
  ownerRealName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerCountry: "",
};

function toCreateBusinessInput(values: BusinessFormValues): CreateBusinessInput {
  return {
    name: values.name,
    description: values.description,
    fundingAmount: values.fundingAmount,
    owner: {
      nickname: values.ownerNickname,
      realName: values.ownerRealName,
      email: values.ownerEmail,
      phone: values.ownerPhone,
      country: values.ownerCountry,
    },
  };
}

export default function BusinessForm({
  onSubmit,
}: {
  onSubmit: (input: CreateBusinessInput) => void | Promise<void>;
}) {
  const [values, setValues] = useState<BusinessFormValues>(EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countryOptions = getCountryList().map((c) => ({ value: c.code, label: c.name }));

  function set<K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const canSubmit =
    values.name !== "" &&
    values.fundingAmount !== "" &&
    values.ownerNickname.length >= 3 &&
    values.ownerRealName !== "" &&
    values.ownerEmail !== "" &&
    values.ownerPhone !== "" &&
    values.ownerCountry !== "" &&
    !isSubmitting;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
          await onSubmit(toCreateBusinessInput(values));
          setValues(EMPTY_VALUES);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Business Name</span>
        <input
          type="text"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Green Harvest Foods"
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Funding Amount Sought</span>
        <Select
          value={values.fundingAmount}
          onChange={(v) => set("fundingAmount", v)}
          options={[{ value: "", label: "Select an amount" }, ...FUNDING_AMOUNT_OPTIONS]}
        />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Description (optional)</span>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="What this business does"
          className={INPUT_CLASSNAME}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 border border-grid-line bg-panel/20 p-4 sm:grid-cols-2">
        <span className={`${LABEL_TEXT_CLASSNAME} sm:col-span-2`}>Business Owner</span>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Nickname</span>
          <input
            type="text"
            value={values.ownerNickname}
            onChange={(e) => set("ownerNickname", e.target.value)}
            placeholder="e.g. HarvestHQ"
            minLength={3}
            maxLength={20}
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Real Name</span>
          <input
            type="text"
            value={values.ownerRealName}
            onChange={(e) => set("ownerRealName", e.target.value)}
            placeholder="e.g. Abena Sarpong"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Email</span>
          <input
            type="email"
            value={values.ownerEmail}
            onChange={(e) => set("ownerEmail", e.target.value)}
            placeholder="e.g. abena@example.com"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Phone</span>
          <input
            type="text"
            value={values.ownerPhone}
            onChange={(e) => set("ownerPhone", e.target.value)}
            placeholder="e.g. +233 24 000 0000"
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={`${LABEL_CLASSNAME} sm:col-span-2`}>
          <span className={LABEL_TEXT_CLASSNAME}>Country</span>
          <ComboSelect
            value={values.ownerCountry}
            onChange={(v) => set("ownerCountry", v)}
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
          {isSubmitting ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Add Business"}
        </motion.button>
      </div>
    </form>
  );
}
