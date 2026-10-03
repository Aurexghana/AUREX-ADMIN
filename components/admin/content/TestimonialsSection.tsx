"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerItem, hoverLift, hoverScale } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import TestimonialForm, { type TestimonialFormValues } from "@/components/admin/content/TestimonialForm";
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, TrashIcon, BookIcon, SpinnerIcon } from "@/components/icons";
import {
  fetchTestimonials,
  createTestimonial,
  updateTestimonial,
  moveTestimonial,
  deleteTestimonial,
  type Testimonial,
} from "@/lib/testimonials";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";

export default function TestimonialsSection() {
  const { session } = useSession();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Testimonial | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchTestimonials().then((rows) => {
      if (cancelled) return;
      setTestimonials(rows);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function move(id: string, direction: "up" | "down") {
    try {
      const reordered = await moveTestimonial(id, direction);
      setTestimonials(reordered);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to reorder testimonial.");
    }
  }

  async function remove(testimonial: Testimonial) {
    try {
      await deleteTestimonial(testimonial.id);
      setTestimonials((prev) => prev.filter((t) => t.id !== testimonial.id));
      setBanner(`Testimonial from "${testimonial.authorInitials}" removed.`);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to remove testimonial.");
    }
  }

  async function handleSave(values: TestimonialFormValues) {
    try {
      if (editing === "new") {
        const created = await createTestimonial(values);
        const finalTestimonial =
          values.state === "published" ? await updateTestimonial(created.id, { state: "published" }) : created;
        setTestimonials((prev) => [...prev, finalTestimonial].sort((a, b) => a.order - b.order));
        setBanner("Testimonial added.");
      } else if (editing) {
        const updated = await updateTestimonial(editing.id, values);
        setTestimonials((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setBanner("Testimonial updated.");
      }
      setEditing(null);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to save testimonial.");
    }
  }

  const sorted = [...testimonials].sort((a, b) => a.order - b.order);

  return (
    <motion.div variants={staggerItem} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Client Testimonials</h2>
          <p className="font-sans text-sm text-cream-dim">The &ldquo;Client Perspectives&rdquo; cards on the homepage.</p>
        </div>
        <motion.button
          {...hoverScale}
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
        >
          <PlusIcon className="size-3.5" /> Add Testimonial
        </motion.button>
      </div>

      {banner && (
        <div className="border border-gold/30 bg-gold/5 p-3 font-sans text-sm text-cream-dim">{banner}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 border border-grid-line bg-panel/20 p-8 font-sans text-sm text-cream-dim">
          <SpinnerIcon className="size-4 animate-spin" /> Loading testimonials…
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={BookIcon}
          title="No testimonials yet"
          description="Add one below."
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
            >
              <PlusIcon className="size-3.5" /> Add Testimonial
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              {...hoverLift}
              className="flex flex-col gap-3 border border-grid-line bg-panel/20 p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-jakarta text-sm font-semibold text-cream">
                    {testimonial.authorInitials} — {testimonial.authorTitle}
                  </span>
                  <StatusBadge
                    label={testimonial.state === "published" ? "Published" : "Draft"}
                    tone={testimonial.state === "published" ? "gold" : "neutral"}
                  />
                </div>
                <p className="max-w-2xl font-sans text-sm text-cream-dim">{testimonial.quote}</p>
                <span className="font-sans text-xs text-cream-dim">Updated {formatDisplayDate(testimonial.updatedAt)}</span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(testimonial.id, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex size-8 items-center justify-center border border-grid-line text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUpIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(testimonial.id, "down")}
                  disabled={index === sorted.length - 1}
                  aria-label="Move down"
                  className="flex size-8 items-center justify-center border border-grid-line text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDownIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(testimonial)}
                  className="border border-grid-line px-2.5 py-1.5 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(testimonial)}
                  aria-label="Remove"
                  className="flex size-8 items-center justify-center border border-[#f87171]/30 text-[#f87171] transition-colors hover:border-[#f87171] hover:bg-[#f87171]/10"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add Testimonial" : "Edit Testimonial"}
      >
        <TestimonialForm
          key={editing === "new" ? "new" : editing?.id}
          testimonial={editing && editing !== "new" ? editing : undefined}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) remove(confirmRemove);
        }}
        title="Remove this testimonial?"
        description={confirmRemove ? `The testimonial from "${confirmRemove.authorInitials}" will be permanently deleted.` : undefined}
        confirmLabel="Remove"
        tone="danger"
      />
    </motion.div>
  );
}
