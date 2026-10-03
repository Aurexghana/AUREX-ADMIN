"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift, hoverScale } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import { type BadgeTone } from "@/components/admin/StatusBadge";
import StatusDot from "@/components/admin/StatusDot";
import EmptyState from "@/components/admin/EmptyState";
import Pagination from "@/components/admin/Pagination";
import Modal from "@/components/admin/Modal";
import MemberForm from "@/components/admin/members/MemberForm";
import { AVATAR_CLASSNAME, DANGER_ROW_CLASSNAME, handleRowClick } from "@/components/admin/tableStyles";
import { PlusIcon, SearchIcon, SpinnerIcon, UsersIcon } from "@/components/icons";
import { useSession } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { fetchMembers, inviteInvestor, type Member, type MemberStatus, type MemberTrack, type NewInvestorInput } from "@/lib/members";

const STATUS_TONE: Record<MemberStatus, BadgeTone> = {
  active: "gold",
  suspended: "danger",
};

const TRACK_LABEL: Record<MemberTrack, string> = {
  investor: "Investor",
  business: "Business Owner",
};

const PAGE_SIZE = 10;

export default function MembersView() {
  const router = useRouter();
  const { session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchMembers().then((rows) => {
      if (!cancelled) {
        setMembers(rows);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.nickname.toLowerCase().includes(q) || m.realName.toLowerCase().includes(q));
  }, [members, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  async function handleAddInvestor(input: NewInvestorInput) {
    try {
      await inviteInvestor(input);
      setBanner(`Invitation sent to ${input.nickname}. They'll appear here once they activate their account.`);
    } catch (err) {
      setBanner(
        err instanceof ApiError ? `Couldn't invite this investor: ${err.message}` : "Something went wrong sending this invitation.",
      );
    } finally {
      setIsAddModalOpen(false);
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
        title="Member Management"
        description="Every registered AUREX member, investor and business owner alike."
        action={
          <motion.button
            {...hoverScale}
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2.5 font-jakarta text-sm font-medium text-amainblack"
          >
            <PlusIcon className="size-3.5" /> Add Investor
          </motion.button>
        }
      />

      {banner && (
        <motion.div variants={staggerItem} className="border border-gold/30 bg-gold/5 p-4 font-sans text-sm text-cream-dim">
          {banner}
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="relative w-full max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cream-dim" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by nickname or real name…"
          className="w-full border border-grid-line bg-panel/60 py-2 pl-9 pr-3 font-sans text-sm text-cream placeholder:text-cream-dim/60 focus:border-gold/50 focus:outline-none"
        />
      </motion.div>

      {isLoading ? (
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-2 border border-grid-line bg-panel/20 p-8 font-sans text-sm text-cream-dim"
        >
          <SpinnerIcon className="size-4 animate-spin" /> Loading members…
        </motion.div>
      ) : filtered.length === 0 ? (
        members.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No members yet"
            description="Registered investors and business owners will appear here once applications are approved."
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={`No members match “${query}”`}
            description="Try a different nickname or real name."
            action={
              <button
                type="button"
                onClick={() => setQuery("")}
                className="border border-grid-line px-3 py-2 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream"
              >
                Clear search
              </button>
            }
          />
        )
      ) : (
        <>
          <motion.div variants={staggerItem} className="hidden overflow-x-auto border border-grid-line lg:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-grid-line bg-panel/40">
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Nickname</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Real Name</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Track</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Joined</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((member) => (
                  <motion.tr
                    key={member.id}
                    {...hoverLift}
                    onClick={handleRowClick(router, `/members/${member.id}`)}
                    className={`cursor-pointer border-b border-grid-line last:border-b-0 hover:bg-panel/30 ${
                      member.status === "suspended" ? DANGER_ROW_CLASSNAME : ""
                    }`}
                  >
                    <td className="p-0">
                      <Link href={`/members/${member.id}`} className="flex items-center gap-3 px-4 py-3">
                        <span className={AVATAR_CLASSNAME}>{member.nickname.slice(0, 2).toUpperCase()}</span>
                        <span className="font-jakarta text-sm font-medium text-cream">{member.nickname}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-cream-dim">{member.realName}</td>
                    <td className="px-4 py-3 font-sans text-sm text-cream-dim">{TRACK_LABEL[member.track]}</td>
                    <td className="px-4 py-3 font-sans text-sm text-cream-dim">{formatDisplayDate(member.joinDate)}</td>
                    <td className="px-4 py-3">
                      <StatusDot label={member.status === "active" ? "Active" : "Suspended"} tone={STATUS_TONE[member.status]} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3 lg:hidden">
            {paginated.map((member) => (
              <motion.div key={`filtered-${member.id}`} {...hoverLift}>
                <Link
                  href={`/members/${member.id}`}
                  className={`flex flex-col gap-2 border border-grid-line bg-panel/20 p-4 ${
                    member.status === "suspended" ? DANGER_ROW_CLASSNAME : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={AVATAR_CLASSNAME}>{member.nickname.slice(0, 2).toUpperCase()}</span>
                      <span className="font-jakarta text-sm font-semibold text-cream">{member.nickname}</span>
                    </div>
                    <StatusDot label={member.status === "active" ? "Active" : "Suspended"} tone={STATUS_TONE[member.status]} />
                  </div>
                  <span className="font-sans text-sm text-cream-dim">{member.realName}</span>
                  <div className="flex items-center justify-between gap-3 text-xs text-cream-dim">
                    <span>{TRACK_LABEL[member.track]}</span>
                    <span>Joined {formatDisplayDate(member.joinDate)}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </motion.div>
        </>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Investor"
        description="Registers a new investor directly, without needing a business to go with them."
      >
        <MemberForm onSubmit={handleAddInvestor} />
      </Modal>
    </motion.div>
  );
}
