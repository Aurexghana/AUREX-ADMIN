/**
 * Admin-role accounts, including ones still awaiting approval from
 * `/auth/register-admin` (see RegisterView's own "an existing admin will
 * need to approve your account" copy). Backed by Aurex-backend's
 * dedicated `/admins` endpoints - list is admin-only, everything else
 * (full profile, approve, reject) is super-admin-only, enforced
 * server-side, so a regular admin's requests to those routes 403.
 */

import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";

export type AdminStatus = "pending" | "active" | "suspended" | "rejected";

export type Admin = {
  id: string;
  nickname: string;
  realName: string;
  email: string;
  phone: string;
  status: AdminStatus;
  isSuperAdmin: boolean;
  createdAt: string;
};

export type AdminDetail = Admin & {
  verified: boolean;
  permissions: string[];
};

// Matches adminsService.list's flat, snake_case row shape.
type AdminListApiRow = {
  id: string;
  nickname: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  status: AdminStatus;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
};

// Matches toUserGetDto's camelCase shape, returned by GET /admins/:id.
type AdminDetailApiRow = {
  id: string;
  nickname: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  status: AdminStatus;
  verified: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  role: string | null;
  createdAt: string;
};

function realNameOf(firstname: string | null, lastname: string | null): string {
  return [firstname, lastname].filter(Boolean).join(" ") || "-";
}

function toAdmin(row: AdminListApiRow): Admin {
  const realName = realNameOf(row.firstname, row.lastname);
  return {
    id: row.id,
    nickname: row.nickname || realName,
    realName,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: row.status,
    isSuperAdmin: row.is_super_admin,
    createdAt: row.created_at,
  };
}

function toAdminDetail(row: AdminDetailApiRow): AdminDetail {
  const realName = realNameOf(row.firstname, row.lastname);
  return {
    id: row.id,
    nickname: row.nickname || realName,
    realName,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: row.status,
    isSuperAdmin: row.isSuperAdmin,
    createdAt: row.createdAt,
    verified: row.verified,
    permissions: row.permissions,
  };
}

export async function fetchAdmins(filters: { status?: AdminStatus } = {}): Promise<Admin[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.status) params.set("status", filters.status);
  try {
    const { data } = await cached(`admins:${params.toString()}`, () =>
      apiFetchPaginated<AdminListApiRow>(`/admins?${params.toString()}`),
    );
    return data.map(toAdmin);
  } catch {
    return [];
  }
}

export async function getPendingAdminCount(): Promise<number> {
  try {
    const { pagination } = await cached("admins:count:pending", () =>
      apiFetchPaginated<AdminListApiRow>("/admins?status=pending&limit=1"),
    );
    return pagination.total;
  } catch {
    return 0;
  }
}

/** Super-admin only - 403s for a regular admin, so callers should only
 *  reach for this behind a `session.user.isSuperAdmin` check. */
export async function fetchAdminById(id: string): Promise<AdminDetail | undefined> {
  try {
    const { data } = await apiFetch<AdminDetailApiRow>(`/admins/${id}`);
    return toAdminDetail(data);
  } catch {
    return undefined;
  }
}

export async function approveAdmin(id: string): Promise<void> {
  await apiFetch(`/admins/${id}/approve`, { method: "PATCH" });
  invalidate("admins");
}

export async function rejectAdmin(id: string): Promise<void> {
  await apiFetch(`/admins/${id}/reject`, { method: "PATCH" });
  invalidate("admins");
}
