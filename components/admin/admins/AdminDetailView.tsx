"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { scrollReveal } from "@/lib/motion";
import { formatDisplayDate } from "@/lib/formatters";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge, { type BadgeTone } from "@/components/admin/StatusBadge";
import { ArrowRightIcon, SpinnerIcon } from "@/components/icons";
import { useSession } from "@/lib/auth";
import { fetchAdminById, type AdminDetail, type AdminStatus } from "@/lib/admins";

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
      <p className="font-sans text-sm text-cream">{value}</p>
    </div>
  );
}

/**
 * Full admin profile - super-admin only, both here and server-side
 * (GET /admins/:id 403s for a regular admin; AdminsView also never links
 * here for one). A regular admin who navigates in directly gets a plain
 * access-denied message instead of a fetch that quietly 403s.
 *
 * Permissions render read-only - the superadmin-grants-permissions flow
 * this backs is backend-only for now, not editable from here yet.
 */
export default function AdminDetailView({ id }: { id: string }) {
  const { session } = useSession();
  const isSuperAdmin = session?.user.isSuperAdmin ?? false;
  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session || !isSuperAdmin) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchAdminById(id).then((result) => {
      if (cancelled) return;
      setAdmin(result ?? null);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, isSuperAdmin, id]);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-sans text-sm text-cream-dim">Only super admins can view an admin&apos;s full profile.</p>
        <Link href="/admins" className="font-jakarta text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
          Back to admins
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 font-sans text-sm text-cream-dim">
        <SpinnerIcon className="size-5 animate-spin" /> Loading admin…
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-sans text-sm text-cream-dim">This admin couldn&apos;t be found.</p>
        <Link href="/admins" className="font-jakarta text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
          Back to admins
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/admins" className="flex w-fit items-center gap-1.5 font-sans text-sm text-cream-dim transition-colors hover:text-gold-bright">
        <span className="rotate-180">
          <ArrowRightIcon className="size-3" />
        </span>
        Back to admins
      </Link>

      <PageHeader
        title={admin.nickname}
        description={admin.isSuperAdmin ? "Super Admin" : "Admin"}
        action={<StatusBadge label={STATUS_LABEL[admin.status]} tone={STATUS_TONE[admin.status]} />}
      />

      <motion.section {...scrollReveal} className="flex flex-col gap-5 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Account Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nickname" value={admin.nickname} />
          <Field label="Full Name" value={admin.realName} />
          <Field label="Email" value={admin.email} />
          <Field label="Phone" value={admin.phone || "-"} />
          <Field label="Verified" value={admin.verified ? "Yes" : "No"} />
          <Field label="Joined" value={formatDisplayDate(admin.createdAt)} />
        </div>
      </motion.section>

      <motion.section {...scrollReveal} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-6">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Permissions</h2>
        {admin.isSuperAdmin ? (
          <p className="font-sans text-sm text-cream-dim">
            Super admins have unrestricted access, so individual permissions don&apos;t apply.
          </p>
        ) : admin.permissions.length === 0 ? (
          <p className="font-sans text-sm text-cream-dim">No specific permissions granted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {admin.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full bg-gold/10 px-3 py-1 font-jakarta text-xs font-medium text-gold-bright"
              >
                {permission}
              </span>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
