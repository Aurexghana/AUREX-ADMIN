"use client";

import { useState } from "react";
import { hoverScale } from "@/lib/motion";
import { motion } from "framer-motion";
import { SpinnerIcon } from "@/components/icons";
import Select from "@/components/admin/Select";
import ComboSelect from "@/components/admin/ComboSelect";
import { getCountryList } from "@/lib/countries";
import type { Member } from "@/lib/members";
import type { CreateBusinessInput } from "@/lib/businesses";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

export const CATEGORY_OPTIONS = [
  { value: "", label: "Select a category" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Logistics", label: "Logistics" },
  { value: "Retail", label: "Retail" },
  { value: "Technology", label: "Technology" },
  { value: "Other", label: "Other" },
];

type OwnerChoice = "admin" | "existing" | "new";

type BusinessFormValues = {
  name: string;
  category: string;
  description: string;
  ownerChoice: OwnerChoice;
  ownerMemberId: string;
  newOwnerNickname: string;
  newOwnerRealName: string;
  newOwnerEmail: string;
  newOwnerPhone: string;
  newOwnerCountry: string;
};

const EMPTY_VALUES: BusinessFormValues = {
  name: "",
  category: "",
  description: "",
  ownerChoice: "admin",
  ownerMemberId: "",
  newOwnerNickname: "",
  newOwnerRealName: "",
  newOwnerEmail: "",
  newOwnerPhone: "",
  newOwnerCountry: "",
};

function toCreateBusinessInput(values: BusinessFormValues): CreateBusinessInput {
  if (values.ownerChoice === "existing") {
    return {
      name: values.name,
      category: values.category,
      description: values.description,
      ownerType: "member",
      ownerMemberId: values.ownerMemberId,
    };
  }
  if (values.ownerChoice === "new") {
    return {
      name: values.name,
      category: values.category,
      description: values.description,
      ownerType: "member",
      newOwner: {
        nickname: values.newOwnerNickname,
        realName: values.newOwnerRealName,
        email: values.newOwnerEmail,
        phone: values.newOwnerPhone,
        country: values.newOwnerCountry,
      },
    };
  }
  return {
    name: values.name,
    category: values.category,
    description: values.description,
    ownerType: "admin",
  };
}

export default function BusinessForm({
  members,
  onSubmit,
}: {
  members: Member[];
  onSubmit: (input: CreateBusinessInput) => void | Promise<void>;
}) {
  const [values, setValues] = useState<BusinessFormValues>(EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countryOptions = getCountryList().map((c) => ({ value: c.code, label: c.name }));

  function set<K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const hasOwnerDetails =
    values.ownerChoice === "admin" ||
    (values.ownerChoice === "existing" && values.ownerMemberId !== "") ||
    (values.ownerChoice === "new" &&
      values.newOwnerNickname.length >= 3 &&
      values.newOwnerRealName !== "" &&
      values.newOwnerEmail !== "" &&
      values.newOwnerPhone !== "" &&
      values.newOwnerCountry !== "");

  const canSubmit = values.name !== "" && values.category !== "" && hasOwnerDetails && !isSubmitting;

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
        <span className={LABEL_TEXT_CLASSNAME}>Category</span>
        <Select value={values.category} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} />
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

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Owned By</span>
        <Select
          value={values.ownerChoice}
          onChange={(v) => set("ownerChoice", v as OwnerChoice)}
          options={[
            { value: "admin", label: "AUREX (Admin)" },
            { value: "existing", label: "Existing Member" },
            { value: "new", label: "New Member" },
          ]}
        />
      </label>

      {values.ownerChoice === "existing" && (
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Member</span>
          <Select
            value={values.ownerMemberId}
            onChange={(v) => set("ownerMemberId", v)}
            options={[
              { value: "", label: "Select a member" },
              ...members.map((m) => ({ value: m.id, label: `${m.nickname} — ${m.realName}` })),
            ]}
          />
        </label>
      )}

      {values.ownerChoice === "new" && (
        <div className="grid grid-cols-1 gap-4 border border-grid-line bg-panel/20 p-4 sm:grid-cols-2">
          <label className={LABEL_CLASSNAME}>
            <span className={LABEL_TEXT_CLASSNAME}>Nickname</span>
            <input
              type="text"
              value={values.newOwnerNickname}
              onChange={(e) => set("newOwnerNickname", e.target.value)}
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
              value={values.newOwnerRealName}
              onChange={(e) => set("newOwnerRealName", e.target.value)}
              placeholder="e.g. Abena Sarpong"
              className={INPUT_CLASSNAME}
            />
          </label>
          <label className={LABEL_CLASSNAME}>
            <span className={LABEL_TEXT_CLASSNAME}>Email</span>
            <input
              type="email"
              value={values.newOwnerEmail}
              onChange={(e) => set("newOwnerEmail", e.target.value)}
              placeholder="e.g. abena@example.com"
              className={INPUT_CLASSNAME}
            />
          </label>
          <label className={LABEL_CLASSNAME}>
            <span className={LABEL_TEXT_CLASSNAME}>Phone</span>
            <input
              type="text"
              value={values.newOwnerPhone}
              onChange={(e) => set("newOwnerPhone", e.target.value)}
              placeholder="e.g. +233 24 000 0000"
              className={INPUT_CLASSNAME}
            />
          </label>
          <label className={`${LABEL_CLASSNAME} sm:col-span-2`}>
            <span className={LABEL_TEXT_CLASSNAME}>Country</span>
            <ComboSelect
              value={values.newOwnerCountry}
              onChange={(v) => set("newOwnerCountry", v)}
              options={countryOptions}
              placeholder="Select a country"
              searchPlaceholder="Search countries…"
              ariaLabel="Country"
            />
          </label>
        </div>
      )}

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
