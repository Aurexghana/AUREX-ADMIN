import { apiFetch, apiFetchPaginated, apiUpload } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";
import type { SlotPackage } from "@/lib/packages";

export type InvestmentStatus = "pending_payment" | "active" | "matured";

export type InvestmentRecord = {
  id: string;
  memberId: string;
  slotPackage: SlotPackage;
  packageName: string;
  businessName?: string;
  amountInvestedGhs: number;
  dateInvested: string;
  earningsToDateGhs: number;
  lastEarningsUpdate: string;
  status: InvestmentStatus;
};

type InvestmentApiRow = {
  id: string;
  user_id: string;
  package_name: string;
  package_type: SlotPackage;
  roi_rate: string;
  business_name: string | null;
  amount_invested: string;
  current_value: string;
  start_date: string;
  maturity_date: string;
  status: InvestmentStatus;
  updated_at: string;
};

function toInvestmentRecord(row: InvestmentApiRow): InvestmentRecord {
  return {
    id: row.id,
    memberId: row.user_id,
    slotPackage: row.package_type,
    packageName: row.package_name,
    businessName: row.business_name ?? undefined,
    amountInvestedGhs: Number(row.amount_invested),
    dateInvested: row.start_date,
    earningsToDateGhs: Number(row.current_value) - Number(row.amount_invested),
    lastEarningsUpdate: row.updated_at.slice(0, 10),
    status: row.status,
  };
}

export async function fetchInvestments(filters: { memberId?: string } = {}): Promise<InvestmentRecord[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.memberId) params.set("user_id", filters.memberId);
  try {
    const { data } = await cached(`investments:${params.toString()}`, () =>
      apiFetchPaginated<InvestmentApiRow>(`/investments?${params.toString()}`),
    );
    return data.map(toInvestmentRecord);
  } catch {
    return [];
  }
}

export type RecordInvestmentInput = {
  memberId: string;
  packageId: string;
  amountInvestedGhs: number;
  dateInvested: string;
  method: "bank_transfer" | "mobile_money" | "cash";
  reference?: string;
  notes?: string;
  proofOfPayment?: File | null;
};

export async function recordInvestment(input: RecordInvestmentInput): Promise<InvestmentRecord> {
  const formData = new FormData();
  formData.set("user_id", input.memberId);
  formData.set("package_id", input.packageId);
  formData.set("amount_invested", String(input.amountInvestedGhs));
  formData.set("start_date", input.dateInvested);
  formData.set("method", input.method);
  if (input.reference) formData.set("reference", input.reference);
  if (input.notes) formData.set("notes", input.notes);
  if (input.proofOfPayment) formData.set("proof_of_payment", input.proofOfPayment);

  const { data } = await apiUpload<InvestmentApiRow>("/investments", formData);
  // Recording an investment can also generate its schedule of payouts
  // server-side once it activates.
  invalidate("investments");
  invalidate("payouts");
  return toInvestmentRecord(data);
}

// Note: "investments:" as a prefix also covers "investments:stats" —
// invalidate("investments") above already clears both the list and the
// stats cached above.

export async function updateEarnings(id: string, currentValueGhs: number): Promise<InvestmentRecord> {
  const { data } = await apiFetch<InvestmentApiRow>(`/investments/${id}/value`, {
    method: "PATCH",
    body: { current_value: currentValueGhs },
  });
  invalidate("investments");
  return toInvestmentRecord(data);
}

export type PackageAllocation = { core: number; ventures: number };
export type MonthlyInvestedPoint = { label: string; cumulativeGhs: number };

type InvestmentStatsApiResponse = {
  totalPlatformInvested: string;
  byPackageType: Record<string, string>;
  monthlyTrend: { month: string; cumulativeAmount: string }[];
};

function fetchInvestmentStats(): Promise<{ success: true; data: InvestmentStatsApiResponse }> {
  return cached("investments:stats", () => apiFetch<InvestmentStatsApiResponse>("/investments/stats"));
}

export async function fetchTotalPlatformInvested(): Promise<number> {
  try {
    const { data } = await fetchInvestmentStats();
    return Number(data.totalPlatformInvested);
  } catch {
    return 0;
  }
}

export async function fetchInvestedByPackage(): Promise<PackageAllocation> {
  try {
    const { data } = await fetchInvestmentStats();
    return { core: Number(data.byPackageType.core ?? 0), ventures: Number(data.byPackageType.ventures ?? 0) };
  } catch {
    return { core: 0, ventures: 0 };
  }
}

export async function fetchMonthlyInvestedTrend(): Promise<MonthlyInvestedPoint[]> {
  try {
    const { data } = await fetchInvestmentStats();
    return data.monthlyTrend.map((point) => {
      const [year, month] = point.month.split("-").map(Number);
      const label = new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      return { label, cumulativeGhs: Number(point.cumulativeAmount) };
    });
  } catch {
    return [];
  }
}
