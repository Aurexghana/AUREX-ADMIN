"use client";

import { useState } from "react";
import Select from "@/components/admin/Select";
import { SpinnerIcon } from "@/components/icons";
import type { ContentBlock, ContentBlockState } from "@/lib/homeContent";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

export type ContentFormValues = { title: string; body: string; state: ContentBlockState };

export default function ContentForm({
  block,
  onCancel,
  onSave,
}: {
  block?: ContentBlock;
  onCancel: () => void;
  onSave: (values: ContentFormValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<ContentFormValues>({
    title: block?.title ?? "",
    body: block?.body ?? "",
    state: block?.state ?? "draft",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof ContentFormValues>(key: K, value: ContentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!values.title.trim()) return;
        setIsSubmitting(true);
        try {
          await onSave(values);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Title</span>
        <input type="text" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. New Ventures slot open" className={INPUT_CLASSNAME} />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>Body</span>
        <textarea value={values.body} onChange={(e) => set("body", e.target.value)} rows={4} className={INPUT_CLASSNAME} />
      </label>

      <label className={LABEL_CLASSNAME}>
        <span className={LABEL_TEXT_CLASSNAME}>State</span>
        <Select
          value={values.state}
          onChange={(v) => set("state", v as ContentBlockState)}
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
          {isSubmitting ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : block ? "Save Changes" : "Add Block"}
        </button>
      </div>
    </form>
  );
}
