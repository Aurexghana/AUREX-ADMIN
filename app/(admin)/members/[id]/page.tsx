import type { Metadata } from "next";
import MemberDetailView from "@/components/admin/members/MemberDetailView";

export const metadata: Metadata = {
  title: "Member | AUREX Admin",
};

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ track?: string }>;
}) {
  const { id } = await params;
  const { track } = await searchParams;
  return <MemberDetailView id={id} track={track === "investor" || track === "business" ? track : undefined} />;
}
