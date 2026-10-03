"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift, hoverScale } from "@/lib/motion";
import { formatGhs, formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import Modal from "@/components/admin/Modal";
import EmptyState from "@/components/admin/EmptyState";
import Pagination from "@/components/admin/Pagination";
import StatusDot from "@/components/admin/StatusDot";
import Select from "@/components/admin/Select";
import { type BadgeTone } from "@/components/admin/StatusBadge";
import { handleRowClick } from "@/components/admin/tableStyles";
import BusinessForm from "@/components/admin/businesses/BusinessForm";
import { BriefcaseIcon, PlusIcon, SearchIcon, SpinnerIcon } from "@/components/icons";
import { getAllBusinesses, createBusiness, type Business, type CreateBusinessInput } from "@/lib/businesses";
import { LISTING_STATUS_LABEL, getFundingPercent, type ListingStatus } from "@/lib/businessListings";
import { fetchMembers, type Member } from "@/lib/members";
import { useSession } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

const PAGE_SIZE = 10;

type StatusFilter = ListingStatus | "not_listed" | "all";

const STATUS_TONE: Record<ListingStatus, BadgeTone> = {
  pending: "neutral",
  live: "gold",
  funded: "success",
  closed: "danger",
};

function ownerLabel(business: Business): string {
  return business.ownerType === "admin" ? "AUREX (Admin)" : (business.ownerMemberNickname ?? "—");
}

function statusOf(business: Business): { label: string; tone: BadgeTone; filterValue: StatusFilter } {
  if (business.listing) {
    return { label: LISTING_STATUS_LABEL[business.listing.status], tone: STATUS_TONE[business.listing.status], filterValue: business.listing.status };
  }
  return { label: "Not Listed", tone: "neutral", filterValue: "not_listed" };
}

/**
 * Every business AUREX knows about — admin-added directly (own or a
 * member's) plus every business that came through the Applications
 * approval pipeline and has a real funding listing (lib/businessListings.ts)
 * behind it. Merges what used to be two separate pages/nav entries
 * ("Businesses" and "Business Listings") into one, via
 * lib/businesses.ts#getAllBusinesses. Click a row to open its detail
 * page (app/(admin)/businesses/[id]) — status, funding, and every other
 * field are managed there, same as the Members page's own detail view.
 */
export default function BusinessesView({ initialStatus = "all" }: { initialStatus?: StatusFilter }) {
  const router = useRouter();
  const { session } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [banner, setBanner] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    Promise.all([getAllBusinesses(), fetchMembers({ track: "investor" })]).then(([rows, investorRows]) => {
      if (cancelled) return;
      setBusinesses(rows);
      setMembers(investorRows);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filtered = useMemo(
    () => businesses.filter((b) => statusFilter === "all" || statusOf(b).filterValue === statusFilter),
    [businesses, statusFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  async function handleCreate(input: CreateBusinessInput) {
    try {
      const created = await createBusiness(input);
      setBusinesses((prev) => [created, ...prev]);
      setStatusFilter("all");
      setPage(1);
      setBanner(`“${created.name}” added, owned by ${ownerLabel(created)}.`);
    } catch (err) {
      setBanner(err instanceof ApiError ? `Couldn't add this business: ${err.message}` : "Something went wrong adding this business.");
    } finally {
      setIsModalOpen(false);
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
        title="Businesses"
        description="Every business AUREX knows about — self-added, member-owned, or raising funds as a published listing. Click one to manage it."
        action={
          <motion.button
            {...hoverScale}
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
          >
            <PlusIcon className="size-3.5" /> Add Business
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
          <SpinnerIcon className="size-4 animate-spin" /> Loading businesses…
        </motion.div>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={BriefcaseIcon}
          title="No businesses yet"
          description="Add one to get started, or wait for an approved application with a Ventures package to show up here."
          action={
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
            >
              <PlusIcon className="size-3.5" /> Add Business
            </button>
          }
        />
      ) : (
        <>
          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "not_listed", label: "Not Listed" },
                ...(Object.keys(LISTING_STATUS_LABEL) as ListingStatus[]).map((status) => ({
                  value: status,
                  label: LISTING_STATUS_LABEL[status],
                })),
              ]}
              ariaLabel="Filter by status"
            />
            <span className="font-sans text-xs text-cream-dim">
              {filtered.length} of {businesses.length}
            </span>
          </motion.div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No businesses match this filter"
              description="Try a different status."
              action={
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="border border-grid-line px-3 py-2 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
                >
                  Clear filter
                </button>
              }
            />
          ) : (
            <>
              <motion.div variants={staggerItem} className="hidden overflow-x-auto border border-grid-line lg:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-grid-line bg-panel/40">
                      <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Business</th>
                      <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Owner</th>
                      <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
                      <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Funding</th>
                      <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((business) => {
                      const status = statusOf(business);
                      return (
                        <motion.tr
                          key={business.id}
                          {...hoverLift}
                          onClick={handleRowClick(router, `/businesses/${business.id}`)}
                          className="cursor-pointer border-b border-grid-line last:border-b-0 hover:bg-panel/30"
                        >
                          <td className="p-0">
                            <Link href={`/businesses/${business.id}`} className="flex flex-col gap-0.5 px-4 py-3">
                              <span className="font-jakarta text-sm font-medium text-cream">{business.name}</span>
                              {business.category && <span className="font-sans text-xs text-cream-dim">{business.category}</span>}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-cream-dim">{ownerLabel(business)}</td>
                          <td className="px-4 py-3">
                            <StatusDot label={status.label} tone={status.tone} />
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-cream-dim">
                            {business.listing
                              ? `${formatGhs(business.listing.amountRaisedGhs)} of ${formatGhs(business.listing.fundingGoalGhs)} (${getFundingPercent(business.listing)}%)`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-cream-dim">
                            {business.createdAt ? formatDisplayDate(business.createdAt) : "—"}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>

              <motion.div variants={staggerItem} className="flex flex-col gap-3 lg:hidden">
                {paginated.map((business) => {
                  const status = statusOf(business);
                  return (
                    <motion.div key={business.id} {...hoverLift}>
                      <Link href={`/businesses/${business.id}`} className="flex flex-col gap-2 border border-grid-line bg-panel/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-jakarta text-sm font-semibold text-cream">{business.name}</span>
                          <StatusDot label={status.label} tone={status.tone} />
                        </div>
                        <span className="font-sans text-xs text-cream-dim">
                          {ownerLabel(business)}
                          {business.category ? ` · ${business.category}` : ""}
                          {business.createdAt ? ` · Added ${formatDisplayDate(business.createdAt)}` : ""}
                        </span>
                        {business.listing && (
                          <span className="font-sans text-xs text-cream-dim">
                            {formatGhs(business.listing.amountRaisedGhs)} raised of {formatGhs(business.listing.fundingGoalGhs)} (
                            {getFundingPercent(business.listing)}%)
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Business"
        description="It can be AUREX's own business, or added on behalf of a member — existing or brand new."
      >
        <BusinessForm members={members} onSubmit={handleCreate} />
      </Modal>
    </motion.div>
  );
}
