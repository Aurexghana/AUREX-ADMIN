import { apiFetch } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";

export type ListingStatus = "pending" | "live" | "funded" | "closed";

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  pending: "Pending Review",
  live: "Live",
  funded: "Funded",
  closed: "Closed",
};

export type BusinessListing = {
  id: string;
  businessName: string;
  ownerNickname: string;
  description: string;
  fundingPurpose: string;
  fundingGoalGhs: number;
  amountRaisedGhs: number;
  backerCount: number;
  status: ListingStatus;
  businessRegDocument?: { fileName: string; uploadedAt: string; url: string };
};

type ListingApiRow = {
  id: string;
  business_name: string;
  owner_nickname: string | null;
  description: string | null;
  funding_purpose: string | null;
  funding_goal: string | null;
  amount_raised: string;
  backer_count: number;
  status: ListingStatus;
  business_reg_document_url: string | null;
  business_reg_document_uploaded_at: string | null;
};

function fileNameFromUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || url);
  } catch {
    return url;
  }
}

function toBusinessListing(row: ListingApiRow): BusinessListing {
  const fileName = fileNameFromUrl(row.business_reg_document_url);
  return {
    id: row.id,
    businessName: row.business_name,
    ownerNickname: row.owner_nickname ?? "-",
    description: row.description ?? "",
    fundingPurpose: row.funding_purpose ?? "",
    fundingGoalGhs: row.funding_goal ? Number(row.funding_goal) : 0,
    amountRaisedGhs: Number(row.amount_raised),
    backerCount: row.backer_count,
    status: row.status,
    businessRegDocument:
      fileName && row.business_reg_document_url
        ? { fileName, uploadedAt: row.business_reg_document_uploaded_at ?? "", url: row.business_reg_document_url }
        : undefined,
  };
}

export async function fetchBusinessListings(): Promise<BusinessListing[]> {
  try {
    const { data } = await cached("listings:", () => apiFetch<ListingApiRow[]>("/businesses/listings"));
    return data.map(toBusinessListing);
  } catch {
    return [];
  }
}

export async function updateBusinessListing(
  id: string,
  params: { description?: string; fundingPurpose?: string },
): Promise<BusinessListing> {
  const { data } = await apiFetch<ListingApiRow>(`/businesses/listings/${id}`, {
    method: "PATCH",
    body: { description: params.description, funding_purpose: params.fundingPurpose },
  });
  invalidate("listings");
  return toBusinessListing(data);
}

export function getFundingPercent(listing: BusinessListing): number {
  if (listing.fundingGoalGhs <= 0) return 0;
  return Math.min(100, Math.round((listing.amountRaisedGhs / listing.fundingGoalGhs) * 100));
}
