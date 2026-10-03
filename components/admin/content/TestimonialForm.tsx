"use client";

import { useState } from "react";
import Select from "@/components/admin/Select";
import { SpinnerIcon } from "@/components/icons";
import type { Testimonial, TestimonialState } from "@/lib/testimonials";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

export type TestimonialFormValues = {
  quote: string;
  authorInitials: string;
  authorTitle: string;
  state: TestimonialState;
};

export default function TestimonialForm({
  testimonial,
  onCancel,
  onSave,
}: {
  testimonial?: Testimonial;
  onCancel: () => void;
  onSave: (values: TestimonialFormValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<TestimonialFormValues>({
    quote: testimonial?.quote ?? "",
    authorInitials: testimonial?.authorInitials ?? "",
    authorTitle: testimonial?.authorTitle ?? "",
    state: testimonial?.state ?? "draft",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof TestimonialFormValues>(key: K, value: TestimonialFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!values.quote.trim() || !values.authorInitials.trim() || !values.authorTitle.trim()) return;
        setIsSubmitting(true);
        try {
          await onSave(values);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Quote</span>
        <textarea
          value={values.quote}
          onChange={(e) => set("quote", e.target.value)}
          rows={4}
          placeholder="What the client said"
          className={INPUT_CLASSNAME}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Author Initials</span>
          <input
            type="text"
            maxLength={10}
            value={values.authorInitials}
            onChange={(e) => set("authorInitials", e.target.value)}
            placeholder="e.g. J.R."
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className={LABEL_CLASSNAME}>
          <span className={LABEL_TEXT_CLASSNAME}>Author Title</span>
          <input
            type="text"
            value={values.authorTitle}
            onChange={(e) => set("authorTitle", e.target.value)}
            placeholder="e.g. Managing Partner"
            className={INPUT_CLASSNAME}
          />
        </label>
      </div>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>State</span>
        <Select
          value={values.state}
          onChange={(v) => set("state", v as TestimonialState)}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
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
          {isSubmitting ? (
            <SpinnerIcon className="mx-auto size-4 animate-spin" />
          ) : testimonial ? (
            "Save Changes"
          ) : (
            "Add Testimonial"
          )}
        </button>
      </div>
    </form>
  );
}
