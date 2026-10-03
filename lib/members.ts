/**
 * Registered AUREX members — approved applicants (see lib/applications.ts)
 * who now have an active account.
 *
 * A Business Owner member's `businessListingId` points at their listing
 * in lib/businessListings.ts (the Member detail view shows that listing's
 * status per the brief, rather than duplicating listing fields here).
 */

import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import { cached } from "@/lib/cache";

export type MemberTrack = "investor" | "business";
export type MemberStatus = "active" | "suspended";

export type Member = {
  id: string;
  nickname: string;
  realName: string;
  track: MemberTrack;
  email: string;
  phone: string;
  country: string;
  joinDate: string;
  status: MemberStatus;
  /** Business Owners only — see lib/businessListings.ts. */
  businessListingId?: string;
};

type MemberApiRow = {
  id: string;
  nickname: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "pending" | "suspended";
  is_active: boolean;
  track: MemberTrack;
  joined_at: string;
  country: string | null;
  business_name: string | null;
};

function toMember(row: MemberApiRow): Member {
  return {
    id: row.id,
    nickname: row.nickname ?? "—",
    realName: [row.firstname, row.lastname].filter(Boolean).join(" ") || "—",
    track: row.track,
    email: row.email ?? "",
    phone: row.phone ?? "",
    country: row.country ?? "",
    joinDate: row.joined_at,
    status: row.is_active && row.status !== "suspended" ? "active" : "suspended",
  };
}

export async function fetchMembers(filters: { track?: MemberTrack } = {}): Promise<Member[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.track) params.set("track", filters.track);
  try {
    const { data } = await cached(`members:${params.toString()}`, () =>
      apiFetchPaginated<MemberApiRow>(`/members?${params.toString()}`),
    );
    return data.map(toMember);
  } catch {
    return [];
  }
}

export async function getMemberCounts(): Promise<{ investorCount: number; businessOwnerCount: number }> {
  try {
    const [investors, businessOwners] = await Promise.all([
      cached("members:count:investor", () => apiFetchPaginated<MemberApiRow>("/members?track=investor&limit=1")),
      cached("members:count:business", () => apiFetchPaginated<MemberApiRow>("/members?track=business&limit=1")),
    ]);
    return { investorCount: investors.pagination.total, businessOwnerCount: businessOwners.pagination.total };
  } catch {
    return { investorCount: 0, businessOwnerCount: 0 };
  }
}

export async function fetchMemberById(id: string): Promise<Member | undefined> {
  try {
    const { data } = await apiFetch<MemberApiRow>(`/members/${id}`);
    return toMember(data);
  } catch {
    return undefined;
  }
}
