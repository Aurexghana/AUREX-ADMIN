import { redirect } from "next/navigation";

/**
 * "Business Listings" merged into the "Businesses" page (see
 * app/(admin)/businesses/page.tsx and lib/businesses.ts#getAllBusinesses)
 * - a listing is just the funding side of a business, and admins now
 * manage both from one place. This route stays only so existing deep
 * links (the Overview dashboard's "Live Business Listings" stat card,
 * any bookmarks) keep working; `status=live` etc. map 1:1 onto the
 * merged page's own status filter.
 */
export default async function ListingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = new URLSearchParams(await searchParams as Record<string, string>);
  const query = params.toString();
  redirect(`/businesses${query ? `?${query}` : ""}`);
}
