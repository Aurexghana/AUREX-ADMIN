import { apiFetch } from "@/lib/api/client";
import { cached } from "@/lib/cache";
import { fetchBusinessListings, type BusinessListing } from "@/lib/businessListings";

export type ApprovedBusiness = { id: string; name: string };

export async function fetchApprovedBusinesses(): Promise<ApprovedBusiness[]> {
  try {
    const { data } = await cached("businesses:approved", () => apiFetch<ApprovedBusiness[]>("/businesses"));
    return data;
  } catch {
    return [];
  }
}

/**
 * A business, from either of its two possible origins:
 *  - "admin_added": created directly by an admin (Add Business flow
 *    below) - mock/in-memory, no backend endpoint exists for this yet.
 *    Swap getBusinesses()/createBusiness() for real apiFetch calls (like
 *    lib/packages.ts#createPackage) once one does. The owner link uses
 *    the real /members API (lib/members.ts#fetchMembers/inviteInvestor)
 *    even though the business record itself is still mock.
 *  - "application": came from the Applications approval pipeline and
 *    has a real, backend-tracked funding listing (lib/businessListings.ts).
 *
 * getAllBusinesses() merges both into this one shape so admins manage
 * every business - self-added or member-owned, listed or not - from a
 * single Businesses page instead of two separate ones. Only
 * "application" rows carry a `listing` (and are editable, via the
 * existing lib/businessListings.ts#updateBusinessListing) since only
 * they have a real funding record behind them.
 */
export type BusinessOwnerType = "admin" | "member";
export type BusinessSource = "admin_added" | "application";

export type Business = {
  id: string;
  name: string;
  /** Free-text category - only set on "admin_added" rows; "application" rows don't carry one. */
  category: string;
  description: string;
  ownerType: BusinessOwnerType;
  /** Set only when ownerType === "member" - the member who owns/invests in this business. */
  ownerMemberId?: string;
  ownerMemberNickname?: string;
  /** Set only on "admin_added" rows - "application" rows don't carry a creation date. */
  createdAt?: string;
  source: BusinessSource;
  /** Set only on "application" rows - the funding/listing side of this business. */
  listing?: BusinessListing;
};

export const CATEGORY_OPTIONS = [
  { value: "", label: "Select a category" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Logistics", label: "Logistics" },
  { value: "Retail", label: "Retail" },
  { value: "Technology", label: "Technology" },
  { value: "Other", label: "Other" },
];

export const FUNDING_AMOUNT_OPTIONS = [
  { value: "under-10000", label: "Under GHS 10,000" },
  { value: "10000-50000", label: "GHS 10,000 – 50,000" },
  { value: "50000-200000", label: "GHS 50,000 – 200,000" },
  { value: "200000-plus", label: "GHS 200,000+" },
];

export type CreateBusinessInput = {
  name: string;
  description: string;
  fundingAmount: string;
  owner: { nickname: string; realName: string; email: string; phone: string; country: string };
};

const BUSINESSES: Business[] = [];

export function getBusinesses(): Business[] {
  return BUSINESSES;
}

function fromListing(listing: BusinessListing): Business {
  return {
    id: listing.id,
    name: listing.businessName,
    category: "",
    description: listing.description,
    ownerType: "member",
    ownerMemberNickname: listing.ownerNickname,
    source: "application",
    listing,
  };
}

/** The merged list this app's Businesses page renders: every admin-added
 *  business plus every real business listing, as one shape. */
export async function getAllBusinesses(): Promise<Business[]> {
  const listings = await fetchBusinessListings();
  return [...BUSINESSES, ...listings.map(fromListing)];
}

/** Single business for the detail page - checks the admin-added mock
 *  list first, then falls back to the real business listings (their ids
 *  don't overlap, so order doesn't matter for correctness, just for
 *  which fetch is skipped when possible). */
export async function getBusinessById(id: string): Promise<Business | undefined> {
  const adminAdded = BUSINESSES.find((b) => b.id === id);
  if (adminAdded) return adminAdded;
  const listings = await fetchBusinessListings();
  const listing = listings.find((l) => l.id === id);
  return listing ? fromListing(listing) : undefined;
}

export type UpdateAdminBusinessInput = { name: string; category: string; description: string };

/** Edits an admin-added business's own fields (name/category/description
 *  - not its owner, set once at creation). Application-sourced rows
 *  aren't editable here - see lib/businessListings.ts#updateBusinessListing
 *  for those, which the detail page calls directly instead. */
export function updateAdminBusiness(id: string, input: UpdateAdminBusinessInput): Business | undefined {
  const business = BUSINESSES.find((b) => b.id === id);
  if (!business) return undefined;
  Object.assign(business, input);
  return business;
}

export async function createBusiness(input: CreateBusinessInput): Promise<void> {
  await apiFetch("/applications/admin", {
    method: "POST",
    body: {
      type: "business",
      business_name: input.name,
      business_description: input.description,
      funding_amount: input.fundingAmount,
      nickname: input.owner.nickname,
      full_name: input.owner.realName,
      email: input.owner.email,
      phone_number: input.owner.phone,
      country: input.owner.country,
    },
  });
}
