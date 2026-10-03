"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift, hoverScale } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import ContentForm, { type ContentFormValues } from "@/components/admin/content/ContentForm";
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, TrashIcon, MegaphoneIcon, SpinnerIcon } from "@/components/icons";
import {
  fetchContentBlocks,
  createContentBlock,
  updateContentBlock,
  moveContentBlock,
  deleteContentBlock,
  type ContentBlock,
} from "@/lib/homeContent";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";

export default function ContentView() {
  const { session } = useSession();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [confirmRemoveBlock, setConfirmRemoveBlock] = useState<ContentBlock | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchContentBlocks().then((rows) => {
      if (cancelled) return;
      setBlocks(rows);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function move(id: string, direction: "up" | "down") {
    try {
      const reordered = await moveContentBlock(id, direction);
      setBlocks(reordered);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to reorder block.");
    }
  }

  async function remove(block: ContentBlock) {
    try {
      await deleteContentBlock(block.id);
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      setBanner(`"${block.title}" removed.`);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to remove block.");
    }
  }

  async function handleSave(values: ContentFormValues) {
    try {
      if (editingBlock === "new") {
        const created = await createContentBlock({ title: values.title, body: values.body });
        const finalBlock = values.state === "published" ? await updateContentBlock(created.id, { state: "published" }) : created;
        setBlocks((prev) => [...prev, finalBlock].sort((a, b) => a.order - b.order));
        setBanner("Block added.");
      } else if (editingBlock) {
        const updated = await updateContentBlock(editingBlock.id, values);
        setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        setBanner("Block updated.");
      }
      setEditingBlock(null);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to save block.");
    }
  }

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader
        title="Home Page Content"
        description="Announcement blocks"
        action={
          <motion.button
            {...hoverScale}
            type="button"
            onClick={() => setEditingBlock("new")}
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
          >
            <PlusIcon className="size-3.5" /> Add Block
          </motion.button>
        }
      />

      {banner && (
        <motion.div variants={staggerItem} className="border border-gold/30 bg-gold/5 p-4 font-sans text-sm text-cream-dim">
          {banner}
        </motion.div>
      )}

      {isLoading ? (
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-2 border border-grid-line bg-panel/20 p-8 font-sans text-sm text-cream-dim"
        >
          <SpinnerIcon className="size-4 animate-spin" /> Loading content…
        </motion.div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title="No content blocks yet"
          description="Add a block below."
          action={
            <button
              type="button"
              onClick={() => setEditingBlock("new")}
              className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
            >
              <PlusIcon className="size-3.5" /> Add Block
            </button>
          }
        />
      ) : (
        <motion.div variants={staggerItem} className="flex flex-col gap-3">
          {sorted.map((block, index) => (
            <motion.div key={block.id} {...hoverLift} className="flex flex-col gap-3 border border-grid-line bg-panel/20 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-jakarta text-sm font-semibold text-cream">{block.title}</span>
                  <StatusBadge label={block.state === "published" ? "Published" : "Draft"} tone={block.state === "published" ? "gold" : "neutral"} />
                </div>
                <p className="max-w-2xl font-sans text-sm text-cream-dim">{block.body}</p>
                <span className="font-sans text-xs text-cream-dim">Updated {formatDisplayDate(block.updatedAt)}</span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(block.id, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex size-8 items-center justify-center border border-grid-line text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUpIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(block.id, "down")}
                  disabled={index === sorted.length - 1}
                  aria-label="Move down"
                  className="flex size-8 items-center justify-center border border-grid-line text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDownIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBlock(block)}
                  className="border border-grid-line px-2.5 py-1.5 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemoveBlock(block)}
                  aria-label="Remove"
                  className="flex size-8 items-center justify-center border border-[#f87171]/30 text-[#f87171] transition-colors hover:border-[#f87171] hover:bg-[#f87171]/10"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        isOpen={editingBlock !== null}
        onClose={() => setEditingBlock(null)}
        title={editingBlock === "new" ? "Add Content Block" : "Edit Content Block"}
      >
        <ContentForm
          key={editingBlock === "new" ? "new" : editingBlock?.id}
          block={editingBlock && editingBlock !== "new" ? editingBlock : undefined}
          onCancel={() => setEditingBlock(null)}
          onSave={handleSave}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmRemoveBlock !== null}
        onClose={() => setConfirmRemoveBlock(null)}
        onConfirm={() => {
          if (confirmRemoveBlock) remove(confirmRemoveBlock);
        }}
        title="Remove this content block?"
        description={confirmRemoveBlock ? `“${confirmRemoveBlock.title}” will be permanently deleted.` : undefined}
        confirmLabel="Remove"
        tone="danger"
      />
    </motion.div>
  );
}
