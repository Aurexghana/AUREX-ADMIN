"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift, hoverScale } from "@/lib/motion";
import { formatGhs, formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import Modal from "@/components/admin/Modal";
import EmptyState from "@/components/admin/EmptyState";
import Pagination from "@/components/admin/Pagination";
import InvestmentForm, { type InvestmentFormValues } from "@/components/admin/investments/InvestmentForm";
import { CoinsIcon, SpinnerIcon } from "@/components/icons";
import { fetchAdminPackages, type InvestmentSlot } from "@/lib/packages";
import { fetchMembers, type Member } from "@/lib/members";
import { fetchInvestments, recordInvestment, updateEarnings, type InvestmentRecord } from "@/lib/investments";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";

const PAGE_SIZE = 10;

export default function InvestmentsView() {
  const { session } = useSession();
  const [records, setRecords] = useState<InvestmentRecord[]>([]);
  const [investors, setInvestors] = useState<Member[]>([]);
  const [openSlots, setOpenSlots] = useState<InvestmentSlot[]>([]);
  const [membersById, setMembersById] = useState<Record<string, Member>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [editingEarnings, setEditingEarnings] = useState<InvestmentRecord | null>(null);
  const [earningsInput, setEarningsInput] = useState("");
  const [isSavingEarnings, setIsSavingEarnings] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    Promise.all([fetchInvestments(), fetchMembers({ track: "investor" }), fetchAdminPackages()]).then(
      ([investmentRows, memberRows, packageRows]) => {
        if (cancelled) return;
        setRecords(investmentRows);
        setInvestors(memberRows.filter((m) => m.status === "active"));
        setOpenSlots(packageRows.filter((s) => s.status === "active"));
        setMembersById(memberRows.reduce<Record<string, Member>>((acc, m) => ({ ...acc, [m.id]: m }), {}));
        setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [session]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const paginatedRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [records, page],
  );

  async function handleRecord(values: InvestmentFormValues) {
    if (!values.method) return;
    try {
      const record = await recordInvestment({
        memberId: values.memberId,
        packageId: values.packageId,
        amountInvestedGhs: Number(values.amountInvestedGhs) || 0,
        dateInvested: values.dateInvested,
        method: values.method,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
        proofOfPayment: values.proofOfPayment,
      });
      setRecords((prev) => [record, ...prev]);
      setPage(1);
      setBanner(`Recorded ${formatGhs(record.amountInvestedGhs)} for ${membersById[values.memberId]?.nickname ?? "member"}.`);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to record investment.");
    }
  }

  function openEarningsModal(record: InvestmentRecord) {
    setEditingEarnings(record);
    setEarningsInput(String(record.earningsToDateGhs));
  }

  async function handleSaveEarnings() {
    if (!editingEarnings) return;
    const earnings = Number(earningsInput) || 0;
    setIsSavingEarnings(true);
    try {
      const updated = await updateEarnings(editingEarnings.id, editingEarnings.amountInvestedGhs + earnings);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setBanner(`Earnings to date updated for ${membersById[editingEarnings.memberId]?.nickname ?? "member"}.`);
      setEditingEarnings(null);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to update earnings.");
    } finally {
      setIsSavingEarnings(false);
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader title="Investment Recording Tool" description="Record new investments and keep each one's earnings to date up to date." />

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
          <SpinnerIcon className="size-4 animate-spin" /> Loading investments…
        </motion.div>
      ) : (
        <>
          <motion.div variants={staggerItem}>
            <InvestmentForm investors={investors} openSlots={openSlots} onSubmit={handleRecord} />
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3">
            <h2 className="font-jakarta text-lg font-semibold text-cream">All Investment Records</h2>

            {records.length === 0 ? (
              <EmptyState
                icon={CoinsIcon}
                title="No investments recorded yet"
                description="Use the form above to record a member's first investment. It'll show up here right away."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto border border-grid-line lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-grid-line bg-panel/40">
                        <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Member</th>
                        <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Slot</th>
                        <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Amount</th>
                        <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Date</th>
                        <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Earnings to Date</th>
                        <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((record) => (
                        <motion.tr key={record.id} {...hoverLift} className="border-b border-grid-line last:border-b-0 hover:bg-panel/30">
                          <td className="px-4 py-3 font-jakarta text-sm font-medium text-cream">{membersById[record.memberId]?.nickname ?? "—"}</td>
                          <td className="px-4 py-3 font-sans text-sm text-cream-dim">
                            {record.businessName ?? record.packageName}
                          </td>
                          <td className="px-4 py-3 font-jakarta text-sm font-semibold text-gold-bright">{formatGhs(record.amountInvestedGhs)}</td>
                          <td className="px-4 py-3 font-sans text-sm text-cream-dim">{formatDisplayDate(record.dateInvested)}</td>
                          <td className="px-4 py-3 font-sans text-sm text-cream-dim">
                            {formatGhs(record.earningsToDateGhs)}{" "}
                            <span className="text-xs">(as of {formatDisplayDate(record.lastEarningsUpdate)})</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openEarningsModal(record)}
                              className="border border-grid-line px-2.5 py-1 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
                            >
                              Update Earnings
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 lg:hidden">
                  {paginatedRecords.map((record) => (
                    <motion.div key={record.id} {...hoverLift} className="flex flex-col gap-2 border border-grid-line bg-panel/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-jakarta text-sm font-semibold text-cream">{membersById[record.memberId]?.nickname ?? "—"}</span>
                        <span className="font-jakarta text-sm font-semibold text-gold-bright">{formatGhs(record.amountInvestedGhs)}</span>
                      </div>
                      <span className="font-sans text-sm text-cream-dim">
                        {record.businessName ?? record.packageName} · {formatDisplayDate(record.dateInvested)}
                      </span>
                      <span className="font-sans text-xs text-cream-dim">
                        Earnings to date: {formatGhs(record.earningsToDateGhs)} (as of {formatDisplayDate(record.lastEarningsUpdate)})
                      </span>
                      <button
                        type="button"
                        onClick={() => openEarningsModal(record)}
                        className="mt-1 w-fit border border-grid-line px-2.5 py-1 font-jakarta text-xs font-medium text-cream-dim"
                      >
                        Update Earnings
                      </button>
                    </motion.div>
                  ))}
                </div>

                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </motion.div>
        </>
      )}

      <Modal
        isOpen={editingEarnings !== null}
        onClose={() => setEditingEarnings(null)}
        title="Update Earnings to Date"
        description="Manually recorded, same as the original figure. This doesn't calculate anything automatically."
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">Earnings to Date (GHS)</span>
            <input
              type="number"
              min={0}
              value={earningsInput}
              onChange={(e) => setEarningsInput(e.target.value)}
              className="w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream focus:border-gold/50 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-grid-line pt-4">
            <button
              type="button"
              onClick={() => setEditingEarnings(null)}
              disabled={isSavingEarnings}
              className="font-sans text-sm text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <motion.button
              {...hoverScale}
              type="button"
              onClick={handleSaveEarnings}
              disabled={isSavingEarnings}
              className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEarnings ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Save"}
            </motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
