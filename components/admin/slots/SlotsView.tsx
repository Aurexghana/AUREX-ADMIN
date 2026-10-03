"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift, hoverScale } from "@/lib/motion";
import { formatGhs, formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import { type BadgeTone } from "@/components/admin/StatusBadge";
import StatusDot from "@/components/admin/StatusDot";
import Select from "@/components/admin/Select";
import { DANGER_ROW_CLASSNAME } from "@/components/admin/tableStyles";
import ActionsMenu, { type ActionMenuItem } from "@/components/admin/ActionsMenu";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import SlotForm, { type SlotFormValues } from "@/components/admin/slots/SlotForm";
import { PencilIcon, PlusIcon, TrashIcon, LayersIcon, SearchIcon, SpinnerIcon } from "@/components/icons";
import {
  SLOT_STATUS_LABEL,
  canPublishSlot,
  fetchAdminPackages,
  createPackage,
  updatePackage,
  publishPackage,
  closePackageEarly,
  deletePackage,
  type InvestmentSlot,
  type PackageInput,
  type SlotStatus,
} from "@/lib/packages";
import { fetchApprovedBusinesses, type ApprovedBusiness } from "@/lib/businesses";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";

const STATUS_TONE: Record<SlotStatus, BadgeTone> = {
  pending: "neutral",
  approved: "neutral",
  rejected: "danger",
  active: "gold",
  closed: "danger",
};

function SlotTable({
  slots,
  packageLabel,
  hasAnyInPackage,
  hasActiveFilter,
  showBusinessColumn,
  onPublish,
  onCloseEarly,
  onEdit,
  onDelete,
  onCreateNew,
  onClearFilter,
}: {
  slots: InvestmentSlot[];
  packageLabel: string;
  hasAnyInPackage: boolean;
  hasActiveFilter: boolean;
  showBusinessColumn: boolean;
  onPublish: (slot: InvestmentSlot) => void;
  onCloseEarly: (slot: InvestmentSlot) => void;
  onEdit: (slot: InvestmentSlot) => void;
  onDelete: (slot: InvestmentSlot) => void;
  onCreateNew: () => void;
  onClearFilter: () => void;
}) {
  function actionItems(slot: InvestmentSlot): ActionMenuItem[] {
    const items: ActionMenuItem[] = [];
    if (slot.status === "approved") {
      items.push({ key: "publish", label: "Publish", tone: "gold", onClick: () => onPublish(slot) });
    }
    if (slot.status === "active") {
      items.push({ key: "closeEarly", label: "Close Early", tone: "danger", onClick: () => onCloseEarly(slot) });
    }
    items.push({ key: "edit", label: "Edit", icon: PencilIcon, onClick: () => onEdit(slot) });
    if (slot.status === "approved") {
      items.push({ key: "delete", label: "Delete", tone: "danger", icon: TrashIcon, onClick: () => onDelete(slot) });
    }
    return items;
  }

  if (slots.length === 0) {
    return hasAnyInPackage && hasActiveFilter ? (
      <EmptyState
        icon={SearchIcon}
        title="No slots match this filter"
        description="Try a different status."
        action={
          <button
            type="button"
            onClick={onClearFilter}
            className="border border-grid-line px-3 py-2 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
          >
            Clear filter
          </button>
        }
      />
    ) : (
      <EmptyState
        icon={LayersIcon}
        title={`No ${packageLabel} slots yet`}
        description="Create one to open it for investment."
        action={
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
          >
            <PlusIcon className="size-3.5" /> Create Slot
          </button>
        }
      />
    );
  }

  return (
    <>
      <motion.div variants={staggerItem} className="hidden overflow-x-auto border border-grid-line lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-grid-line bg-panel/40">
              {showBusinessColumn && (
                <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Business</th>
              )}
              <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Min. / Rate</th>
              <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Window</th>
              <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
              <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <motion.tr
                key={slot.id}
                {...hoverLift}
                className={`border-b border-grid-line last:border-b-0 hover:bg-panel/30 ${
                  slot.status === "closed" ? DANGER_ROW_CLASSNAME : ""
                }`}
              >
                {showBusinessColumn && (
                  <td className="px-4 py-3 font-sans text-sm text-cream-dim">{slot.businessName ?? "—"}</td>
                )}
                <td className="px-4 py-3 font-sans text-sm text-cream-dim">
                  {formatGhs(slot.minInvestmentGhs)} · {slot.ratePercentLabel}
                </td>
                <td className="px-4 py-3 font-sans text-sm text-cream-dim">
                  {slot.opensAt ? formatDisplayDate(slot.opensAt) : "—"} – {slot.closesAt ? formatDisplayDate(slot.closesAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusDot label={SLOT_STATUS_LABEL[slot.status]} tone={STATUS_TONE[slot.status]} />
                </td>
                <td className="px-4 py-3">
                  <ActionsMenu label={`${slot.name} slot actions`} items={actionItems(slot)} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-col gap-3 lg:hidden">
        {slots.map((slot) => (
          <motion.div
            key={slot.id}
            {...hoverLift}
            className={`flex flex-col gap-2 border border-grid-line bg-panel/20 p-4 ${
              slot.status === "closed" ? DANGER_ROW_CLASSNAME : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-jakarta text-sm font-semibold text-cream">
                {slot.businessName ?? slot.name}
              </span>
              <div className="flex items-center gap-2">
                <StatusDot label={SLOT_STATUS_LABEL[slot.status]} tone={STATUS_TONE[slot.status]} />
                <ActionsMenu label={`${slot.name} slot actions`} items={actionItems(slot)} />
              </div>
            </div>
            <span className="font-sans text-xs text-cream-dim">
              {formatGhs(slot.minInvestmentGhs)} min · {slot.ratePercentLabel} ·{" "}
              {slot.opensAt ? formatDisplayDate(slot.opensAt) : "—"} – {slot.closesAt ? formatDisplayDate(slot.closesAt) : "—"}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

function fromFormValues(values: SlotFormValues): PackageInput {
  return {
    packageType: values.package,
    businessId: values.package === "ventures" ? values.businessId || undefined : undefined,
    name: values.name.trim(),
    roiRate: Number(values.roiRatePercent) || 0,
    termMonths: Number(values.termMonths) || 0,
    payoutFrequency: values.payoutFrequency,
    minInvestmentGhs: Number(values.minInvestmentGhs) || 0,
    maxInvestmentGhs: Number(values.maxInvestmentGhs) || 0,
    fundLimitGhs: values.package === "ventures" && values.fundLimitGhs ? Number(values.fundLimitGhs) : undefined,
    opensAt: values.opensAt || undefined,
    closesAt: values.closesAt || undefined,
  };
}

type SlotAction = "publish" | "closeEarly" | "delete";

const CONFIRM_COPY: Record<
  SlotAction,
  { title: string; description: (slot: InvestmentSlot) => string; confirmLabel: string; tone: "gold" | "danger" }
> = {
  publish: {
    title: "Publish this slot?",
    description: (slot) => `“${slot.name}” will open for investment immediately.`,
    confirmLabel: "Publish",
    tone: "gold",
  },
  closeEarly: {
    title: "Close this slot early?",
    description: (slot) => `“${slot.name}” will stop accepting new investment right away.`,
    confirmLabel: "Close Early",
    tone: "danger",
  },
  delete: {
    title: "Delete this draft slot?",
    description: (slot) => `“${slot.name}” will be permanently deleted. This can't be undone.`,
    confirmLabel: "Delete",
    tone: "danger",
  },
};

export default function SlotsView({ initialStatus = "all" }: { initialStatus?: SlotStatus | "all" }) {
  const { session } = useSession();
  const [slots, setSlots] = useState<InvestmentSlot[]>([]);
  const [approvedBusinesses, setApprovedBusinesses] = useState<ApprovedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SlotStatus | "all">(initialStatus);
  const [modalSlot, setModalSlot] = useState<InvestmentSlot | "new" | null>(null);
  const [publishError, setPublishError] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<string | null>(null);
  const [confirmSlotAction, setConfirmSlotAction] = useState<{ type: SlotAction; slot: InvestmentSlot } | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    Promise.all([fetchAdminPackages(), fetchApprovedBusinesses()]).then(([packageRows, businessRows]) => {
      if (cancelled) return;
      setSlots(packageRows);
      setApprovedBusinesses(businessRows);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filtered = useMemo(
    () => slots.filter((s) => statusFilter === "all" || s.status === statusFilter),
    [slots, statusFilter]
  );

  const coreSlots = useMemo(() => filtered.filter((s) => s.package === "core"), [filtered]);
  const venturesSlots = useMemo(() => filtered.filter((s) => s.package === "ventures"), [filtered]);
  const hasActiveFilter = statusFilter !== "all";
  const hasAnyCoreSlots = useMemo(() => slots.some((s) => s.package === "core"), [slots]);
  const hasAnyVenturesSlots = useMemo(() => slots.some((s) => s.package === "ventures"), [slots]);

  function closeModal() {
    setModalSlot(null);
    setPublishError(undefined);
  }

  function replaceOrAppend(slot: InvestmentSlot) {
    setSlots((prev) => (prev.some((s) => s.id === slot.id) ? prev.map((s) => (s.id === slot.id ? slot : s)) : [...prev, slot]));
  }

  async function handleSaveDraft(values: SlotFormValues) {
    try {
      if (modalSlot === "new") {
        const created = await createPackage(fromFormValues(values));
        replaceOrAppend(created);
        setBanner("Slot saved as a draft.");
      } else if (modalSlot) {
        const updated = await updatePackage(modalSlot.id, fromFormValues(values));
        replaceOrAppend(updated);
        setBanner("Slot updated and kept as a draft.");
      }
      closeModal();
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Failed to save slot.");
    }
  }

  async function handlePublishFromForm(values: SlotFormValues) {
    const draft = fromFormValues(values);
    if (!canPublishSlot({ package: draft.packageType, businessId: draft.businessId, businessStatus: approvedBusinesses.some((b) => b.id === draft.businessId) ? "approved" : undefined })) {
      setPublishError("Cannot publish: a Ventures slot must be linked to an approved business.");
      return;
    }
    try {
      const saved = modalSlot === "new" ? await createPackage(draft) : await updatePackage(modalSlot!.id, draft);
      const published = await publishPackage(saved.id);
      replaceOrAppend(published);
      setBanner("Slot published, now open for investment.");
      closeModal();
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Failed to publish slot.");
    }
  }

  async function handlePublishFromList(slot: InvestmentSlot) {
    if (!canPublishSlot(slot)) {
      setBanner(`Cannot publish “${slot.name}”: it needs a linked, approved business first.`);
      return;
    }
    try {
      const published = await publishPackage(slot.id);
      replaceOrAppend(published);
      setBanner("Slot published, now open for investment.");
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to publish slot.");
    }
  }

  async function handleCloseEarly(slot: InvestmentSlot) {
    try {
      const closed = await closePackageEarly(slot.id);
      replaceOrAppend(closed);
      setBanner(`“${slot.name}” slot closed early.`);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to close slot.");
    }
  }

  async function handleDeleteSlot(slot: InvestmentSlot) {
    try {
      await deletePackage(slot.id);
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      setBanner(`“${slot.name}” draft deleted.`);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to delete slot.");
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader
        title="Investment Slot Management"
        description="Publish and manage AUREX Core and Ventures investment slots."
        action={
          <motion.button
            {...hoverScale}
            type="button"
            onClick={() => setModalSlot("new")}
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
          >
            <PlusIcon className="size-3.5" /> Create Slot
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
          <SpinnerIcon className="size-4 animate-spin" /> Loading slots…
        </motion.div>
      ) : (
        <>
          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as SlotStatus | "all")}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "approved", label: "Draft" },
                { value: "active", label: "Open" },
                { value: "closed", label: "Closed" },
              ]}
              ariaLabel="Filter by status"
            />
            <span className="font-sans text-xs text-cream-dim">
              {filtered.length} of {slots.length}
            </span>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3">
            <h2 className="font-jakarta text-base font-semibold text-cream">AUREX Core</h2>
            <SlotTable
              slots={coreSlots}
              packageLabel="AUREX Core"
              hasAnyInPackage={hasAnyCoreSlots}
              hasActiveFilter={hasActiveFilter}
              showBusinessColumn={false}
              onPublish={(slot) => setConfirmSlotAction({ type: "publish", slot })}
              onCloseEarly={(slot) => setConfirmSlotAction({ type: "closeEarly", slot })}
              onEdit={(slot) => setModalSlot(slot)}
              onDelete={(slot) => setConfirmSlotAction({ type: "delete", slot })}
              onCreateNew={() => setModalSlot("new")}
              onClearFilter={() => setStatusFilter("all")}
            />
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3">
            <h2 className="font-jakarta text-base font-semibold text-cream">AUREX Ventures</h2>
            <SlotTable
              slots={venturesSlots}
              packageLabel="AUREX Ventures"
              hasAnyInPackage={hasAnyVenturesSlots}
              hasActiveFilter={hasActiveFilter}
              showBusinessColumn={true}
              onPublish={(slot) => setConfirmSlotAction({ type: "publish", slot })}
              onCloseEarly={(slot) => setConfirmSlotAction({ type: "closeEarly", slot })}
              onEdit={(slot) => setModalSlot(slot)}
              onDelete={(slot) => setConfirmSlotAction({ type: "delete", slot })}
              onCreateNew={() => setModalSlot("new")}
              onClearFilter={() => setStatusFilter("all")}
            />
          </motion.div>
        </>
      )}

      <Modal
        isOpen={modalSlot !== null}
        onClose={closeModal}
        title={modalSlot === "new" ? "Create Investment Slot" : "Edit Investment Slot"}
        description="Ventures slots must link to an approved business before they can be published."
      >
        <SlotForm
          key={modalSlot === "new" ? "new" : modalSlot?.id}
          slot={modalSlot && modalSlot !== "new" ? modalSlot : undefined}
          approvedBusinesses={approvedBusinesses}
          onCancel={closeModal}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublishFromForm}
          publishError={publishError}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmSlotAction !== null}
        onClose={() => setConfirmSlotAction(null)}
        onConfirm={() => {
          if (!confirmSlotAction) return;
          if (confirmSlotAction.type === "publish") handlePublishFromList(confirmSlotAction.slot);
          else if (confirmSlotAction.type === "closeEarly") handleCloseEarly(confirmSlotAction.slot);
          else handleDeleteSlot(confirmSlotAction.slot);
        }}
        title={confirmSlotAction ? CONFIRM_COPY[confirmSlotAction.type].title : ""}
        description={confirmSlotAction ? CONFIRM_COPY[confirmSlotAction.type].description(confirmSlotAction.slot) : undefined}
        confirmLabel={confirmSlotAction ? CONFIRM_COPY[confirmSlotAction.type].confirmLabel : undefined}
        tone={confirmSlotAction ? CONFIRM_COPY[confirmSlotAction.type].tone : undefined}
      />
    </motion.div>
  );
}
