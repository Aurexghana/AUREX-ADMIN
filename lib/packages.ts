import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";

export type SlotPackage = "core" | "ventures";
export type SlotStatus = "pending" | "approved" | "rejected" | "active" | "closed";
export type PayoutFrequency = "monthly" | "quarterly" | "at_maturity";
export type BusinessStatus = "pending" | "approved" | "rejected";

export const SLOT_PACKAGE_LABEL: Record<SlotPackage, string> = {
  core: "AUREX Core",
  ventures: "AUREX Ventures",
};

// `approved` here means "approved but not yet published" — the admin's own
// pre-publish state, same concept the old mock called "draft". `pending`/
// `rejected` aren't reachable from today's admin-only Create flow (every
// package an admin creates lands `approved` immediately) — they're wired
// for a future flow where a business proposes a package for admin review.
export const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
  pending: "Pending Review",
  approved: "Draft",
  rejected: "Rejected",
  active: "Open",
  closed: "Closed",
};

export type InvestmentSlot = {
  id: string;
  name: string;
  package: SlotPackage;
  businessId?: string;
  businessName?: string;
  businessStatus?: BusinessStatus;
  minInvestmentGhs: number;
  maxInvestmentGhs: number;
  fundLimitGhs?: number;
  termMonths: number;
  termLabel: string;
  roiRate: number;
  ratePercentLabel: string;
  payoutFrequency: PayoutFrequency;
  opensAt: string;
  closesAt: string;
  status: SlotStatus;
};

type PackageApiRow = {
  id: string;
  package_type: SlotPackage;
  business_id: string | null;
  business_name: string | null;
  business_status: BusinessStatus | null;
  name: string;
  roi_rate: string;
  term_length: number;
  payout_frequency: PayoutFrequency;
  min_investment: string;
  max_investment: string;
  fund_limit: string | null;
  opens_at: string | null;
  closes_at: string | null;
  status: "draft" | "pending" | "approved" | "rejected" | "active" | "funded" | "closed";
};

function toSlotStatus(status: PackageApiRow["status"]): SlotStatus {
  if (status === "active") return "active";
  if (status === "closed" || status === "funded") return "closed";
  if (status === "pending") return "pending";
  if (status === "rejected") return "rejected";
  return "approved";
}

function toInvestmentSlot(row: PackageApiRow): InvestmentSlot {
  return {
    id: row.id,
    name: row.name,
    package: row.package_type,
    businessId: row.business_id ?? undefined,
    businessName: row.business_name ?? undefined,
    businessStatus: row.business_status ?? undefined,
    minInvestmentGhs: Number(row.min_investment),
    maxInvestmentGhs: Number(row.max_investment),
    fundLimitGhs: row.fund_limit ? Number(row.fund_limit) : undefined,
    termMonths: row.term_length,
    termLabel: `${row.term_length}-month term`,
    roiRate: Number(row.roi_rate),
    ratePercentLabel: `${Number(row.roi_rate)}% p.a.`,
    payoutFrequency: row.payout_frequency,
    opensAt: row.opens_at ?? "",
    closesAt: row.closes_at ?? "",
    status: toSlotStatus(row.status),
  };
}

export function canPublishSlot(slot: Pick<InvestmentSlot, "package" | "businessId" | "businessStatus">): boolean {
  if (slot.package !== "ventures") return true;
  if (!slot.businessId) return false;
  return slot.businessStatus === "approved";
}

export async function fetchAdminPackages(): Promise<InvestmentSlot[]> {
  try {
    const { data } = await cached("packages:limit=100", () =>
      apiFetchPaginated<PackageApiRow>("/packages?limit=100"),
    );
    return data.map(toInvestmentSlot);
  } catch {
    return [];
  }
}

export type PackageInput = {
  packageType: SlotPackage;
  businessId?: string;
  name: string;
  roiRate: number;
  termMonths: number;
  payoutFrequency: PayoutFrequency;
  minInvestmentGhs: number;
  maxInvestmentGhs: number;
  fundLimitGhs?: number;
  opensAt?: string;
  closesAt?: string;
};

function toPackageBody(input: Partial<PackageInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.packageType !== undefined) body.package_type = input.packageType;
  if (input.businessId !== undefined) body.business_id = input.businessId || undefined;
  if (input.name !== undefined) body.name = input.name;
  if (input.roiRate !== undefined) body.roi_rate = input.roiRate;
  if (input.termMonths !== undefined) body.term_length = input.termMonths;
  if (input.payoutFrequency !== undefined) body.payout_frequency = input.payoutFrequency;
  if (input.minInvestmentGhs !== undefined) body.min_investment = input.minInvestmentGhs;
  if (input.maxInvestmentGhs !== undefined) body.max_investment = input.maxInvestmentGhs;
  if (input.fundLimitGhs !== undefined) body.fund_limit = input.fundLimitGhs || undefined;
  if (input.opensAt !== undefined) body.opens_at = input.opensAt || undefined;
  if (input.closesAt !== undefined) body.closes_at = input.closesAt || undefined;
  return body;
}

export async function createPackage(input: PackageInput): Promise<InvestmentSlot> {
  const { data } = await apiFetch<PackageApiRow>("/packages", { method: "POST", body: toPackageBody(input) });
  invalidate("packages");
  return toInvestmentSlot(data);
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<InvestmentSlot> {
  const { data } = await apiFetch<PackageApiRow>(`/packages/${id}`, { method: "PATCH", body: toPackageBody(input) });
  invalidate("packages");
  return toInvestmentSlot(data);
}

export async function approvePackage(id: string): Promise<InvestmentSlot> {
  const { data } = await apiFetch<PackageApiRow>(`/packages/${id}/approve`, { method: "PATCH" });
  invalidate("packages");
  return toInvestmentSlot(data);
}

export async function rejectPackage(id: string): Promise<InvestmentSlot> {
  const { data } = await apiFetch<PackageApiRow>(`/packages/${id}/reject`, { method: "PATCH" });
  invalidate("packages");
  return toInvestmentSlot(data);
}

export async function publishPackage(id: string): Promise<InvestmentSlot> {
  const { data } = await apiFetch<PackageApiRow>(`/packages/${id}/publish`, { method: "PATCH" });
  invalidate("packages");
  return toInvestmentSlot(data);
}

export async function closePackageEarly(id: string): Promise<InvestmentSlot> {
  const { data } = await apiFetch<PackageApiRow>(`/packages/${id}/close`, { method: "PATCH" });
  invalidate("packages");
  return toInvestmentSlot(data);
}

export async function deletePackage(id: string): Promise<void> {
  await apiFetch(`/packages/${id}`, { method: "DELETE" });
  invalidate("packages");
}
