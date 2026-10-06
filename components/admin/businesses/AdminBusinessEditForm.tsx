"use client";

import { useState } from "react";
import { hoverScale } from "@/lib/motion";
import { motion } from "framer-motion";
import { SpinnerIcon } from "@/components/icons";
import Select from "@/components/admin/Select";
import { CATEGORY_OPTIONS } from "@/lib/businesses";
import type { Business, UpdateAdminBusinessInput } from "@/lib/businesses";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

/** Edits an admin-added business's own fields - not its owner, which is
 *  set once at creation (lib/businesses.ts#createBusiness) and isn't
 *  reassignable here. */
export default function AdminBusinessEditForm({
  business,
  onCancel,
  onSave,
}: {
  business: Business;
  onCancel: () => void;
  onSave: (values: UpdateAdminBusinessInput) => void | Promise<void>;
}) {
  const [values, setValues] = useState<UpdateAdminBusinessInput>({
    name: business.name,
    category: business.category,
    description: business.description,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof UpdateAdminBusinessInput>(key: K, value: UpdateAdminBusinessInput[K]) {
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
      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Business Name</span>
        <input type="text" value={values.name} onChange={(e) => set("name", e.target.value)} className={INPUT_CLASSNAME} />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Category</span>
        <Select value={values.category} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Description</span>
        <textarea value={values.description} onChange={(e) => set("description", e.target.value)} rows={4} className={INPUT_CLASSNAME} />
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
        <motion.button
          {...hoverScale}
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Save Changes"}
        </motion.button>
      </div>
    </form>
  );
}
