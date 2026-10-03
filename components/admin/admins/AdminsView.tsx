"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, hoverLift } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import { type BadgeTone } from "@/components/admin/StatusBadge";
import StatusDot from "@/components/admin/StatusDot";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Pagination from "@/components/admin/Pagination";
import ActionsMenu, { type ActionMenuItem } from "@/components/admin/ActionsMenu";
import { AVATAR_CLASSNAME, DANGER_ROW_CLASSNAME, handleRowClick } from "@/components/admin/tableStyles";
import { CheckIcon, XIcon, SearchIcon, SpinnerIcon, UserIcon } from "@/components/icons";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";
import { approveAdmin, fetchAdmins, rejectAdmin, type Admin, type AdminStatus } from "@/lib/admins";

const STATUS_TONE: Record<AdminStatus, BadgeTone> = {
  pending: "neutral",
  active: "gold",
  suspended: "danger",
  rejected: "danger",
};

const STATUS_LABEL: Record<AdminStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
  rejected: "Rejected",
};

type AdminAction = "approve" | "reject";

const CONFIRM_COPY: Record<
  AdminAction,
  { title: string; description: (admin: Admin) => string; confirmLabel: string; tone: "gold" | "danger" }
> = {
  approve: {
    title: "Approve this admin?",
    description: (admin) => `${admin.nickname} will be granted full admin access.`,
    confirmLabel: "Approve",
    tone: "gold",
  },
  reject: {
    title: "Reject this admin request?",
    description: (admin) => `${admin.nickname}'s admin request will be rejected.`,
    confirmLabel: "Reject",
    tone: "danger",
  },
};

const PAGE_SIZE = 10;

function SuperAdminTag() {
  return (
    <span className="rounded-full bg-gold/15 px-2 py-0.5 font-jakarta text-[10px] font-semibold uppercase tracking-wide text-gold-bright">
      Super Admin
    </span>
  );
}

/**
 * Admin account roster - every admin-role user, including ones still
 * awaiting approval from `/auth/register-admin`. Backed by the real
 * `/admins` endpoints. Approving/rejecting a pending admin and clicking
 * through to a full profile (AdminDetailView) are super-admin-only,
 * enforced server-side (a regular admin's calls to those routes 403) and
 * mirrored here so a regular admin simply doesn't see those controls.
 */
export default function AdminsView() {
  const router = useRouter();
  const { session } = useSession();
  const isSuperAdmin = session?.user.isSuperAdmin ?? false;
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: AdminAction; admin: Admin } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchAdmins().then((rows) => {
      if (!cancelled) {
        setAdmins(rows);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) => a.nickname.toLowerCase().includes(q) || a.realName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [admins, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  function actionItems(admin: Admin): ActionMenuItem[] {
    if (!isSuperAdmin || admin.status !== "pending") return [];
    return [
      {
        key: "approve",
        label: "Approve",
        tone: "gold",
        icon: CheckIcon,
        onClick: () => setConfirmAction({ type: "approve", admin }),
      },
      {
        key: "reject",
        label: "Reject",
        tone: "danger",
        icon: XIcon,
        onClick: () => setConfirmAction({ type: "reject", admin }),
      },
    ];
  }

  async function applyAction() {
    if (!confirmAction || isSubmitting) return;
    const { type, admin } = confirmAction;
    setIsSubmitting(true);
    try {
      if (type === "approve") {
        await approveAdmin(admin.id);
        setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, status: "active" } : a)));
        setActionMessage(`${admin.nickname} was approved.`);
      } else {
        await rejectAdmin(admin.id);
        setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, status: "rejected" } : a)));
        setActionMessage(`${admin.nickname}'s request was rejected.`);
      }
      setActionFailed(false);
    } catch (err) {
      setActionFailed(true);
      setActionMessage(
        err instanceof ApiError
          ? `Couldn't ${type} this admin: ${err.message}`
          : `Something went wrong trying to ${type} this admin.`,
      );
    } finally {
      setIsSubmitting(false);
      setConfirmAction(null);
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader title="Admin Management" description="Approve pending sign-ups and manage every admin account." />

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            actionFailed
              ? "border border-[#f87171]/30 bg-[#f87171]/5 p-4 font-sans text-sm text-[#f87171]"
              : "border border-gold/30 bg-gold/5 p-4 font-sans text-sm text-cream-dim"
          }
        >
          {actionMessage}
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
          placeholder="Search by nickname, name, or email…"
          className="w-full border border-grid-line bg-panel/60 py-2 pl-9 pr-3 font-sans text-sm text-cream placeholder:text-cream-dim/60 focus:border-gold/50 focus:outline-none"
        />
      </motion.div>

      {isLoading ? (
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-2 border border-grid-line bg-panel/20 p-8 font-sans text-sm text-cream-dim"
        >
          <SpinnerIcon className="size-4 animate-spin" /> Loading admins…
        </motion.div>
      ) : filtered.length === 0 ? (
        admins.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No admin accounts yet"
            description="Admin sign-ups will show up here as soon as someone registers."
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={`No admins match “${query}”`}
            description="Try a different nickname, name, or email."
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
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Full Name</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Email</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Joined</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Status</th>
                  <th className="px-4 py-3 font-sans text-xs font-medium uppercase tracking-wide text-cream-dim">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((admin) => {
                  const items = actionItems(admin);
                  return (
                    <motion.tr
                      key={admin.id}
                      {...hoverLift}
                      onClick={isSuperAdmin ? handleRowClick(router, `/admins/${admin.id}`) : undefined}
                      className={`border-b border-grid-line last:border-b-0 ${isSuperAdmin ? "cursor-pointer hover:bg-panel/30" : ""} ${
                        admin.status === "suspended" || admin.status === "rejected" ? DANGER_ROW_CLASSNAME : ""
                      }`}
                    >
                      <td className="p-0">
                        {isSuperAdmin ? (
                          <Link href={`/admins/${admin.id}`} className="flex items-center gap-3 px-4 py-3">
                            <span className={AVATAR_CLASSNAME}>{admin.nickname.slice(0, 2).toUpperCase()}</span>
                            <span className="font-jakarta text-sm font-medium text-cream">{admin.nickname}</span>
                            {admin.isSuperAdmin && <SuperAdminTag />}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3">
                            <span className={AVATAR_CLASSNAME}>{admin.nickname.slice(0, 2).toUpperCase()}</span>
                            <span className="font-jakarta text-sm font-medium text-cream">{admin.nickname}</span>
                            {admin.isSuperAdmin && <SuperAdminTag />}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans text-sm text-cream-dim">{admin.realName}</td>
                      <td className="px-4 py-3 font-sans text-sm text-cream-dim">{admin.email}</td>
                      <td className="px-4 py-3 font-sans text-sm text-cream-dim">{formatDisplayDate(admin.createdAt)}</td>
                      <td className="px-4 py-3">
                        <StatusDot label={STATUS_LABEL[admin.status]} tone={STATUS_TONE[admin.status]} />
                      </td>
                      <td className="px-4 py-3">
                        {items.length > 0 && <ActionsMenu label={`${admin.nickname} actions`} items={items} />}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-3 lg:hidden">
            {paginated.map((admin) => {
              const items = actionItems(admin);
              return (
                <div
                  key={admin.id}
                  onClick={isSuperAdmin ? handleRowClick(router, `/admins/${admin.id}`) : undefined}
                  className={`flex flex-col gap-3 border border-grid-line bg-panel/20 p-4 ${isSuperAdmin ? "cursor-pointer" : ""} ${
                    admin.status === "suspended" || admin.status === "rejected" ? DANGER_ROW_CLASSNAME : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={AVATAR_CLASSNAME}>{admin.nickname.slice(0, 2).toUpperCase()}</span>
                      {isSuperAdmin ? (
                        <Link href={`/admins/${admin.id}`} className="font-jakarta text-sm font-semibold text-cream">
                          {admin.nickname}
                        </Link>
                      ) : (
                        <span className="font-jakarta text-sm font-semibold text-cream">{admin.nickname}</span>
                      )}
                      {admin.isSuperAdmin && <SuperAdminTag />}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot label={STATUS_LABEL[admin.status]} tone={STATUS_TONE[admin.status]} />
                      {items.length > 0 && <ActionsMenu label={`${admin.nickname} actions`} items={items} />}
                    </div>
                  </div>
                  <span className="font-sans text-sm text-cream-dim">
                    {admin.realName} · {admin.email}
                  </span>
                  <span className="font-sans text-xs text-cream-dim">Joined {formatDisplayDate(admin.createdAt)}</span>
                </div>
              );
            })}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </motion.div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={applyAction}
        title={confirmAction ? CONFIRM_COPY[confirmAction.type].title : ""}
        description={confirmAction ? CONFIRM_COPY[confirmAction.type].description(confirmAction.admin) : undefined}
        confirmLabel={confirmAction ? CONFIRM_COPY[confirmAction.type].confirmLabel : undefined}
        tone={confirmAction ? CONFIRM_COPY[confirmAction.type].tone : undefined}
      />
    </motion.div>
  );
}
