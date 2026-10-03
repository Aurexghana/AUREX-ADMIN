import type { Metadata } from "next";
import OverviewView from "@/components/admin/overview/OverviewView";
import { getMemberCounts } from "@/lib/members";
import { getOpenReportCount } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Overview | AUREX Admin",
};

/**
 * The Admin landing page. Member counts, the invested trend/allocation
 * figures, open-slot count, and live-listing count are all real, either
 * fetched here or by OverviewView itself.
 */
export default async function OverviewPage() {
  const [memberCounts, openReportCount] = await Promise.all([getMemberCounts(), getOpenReportCount()]);

  const stats = {
    investorCount: memberCounts.investorCount,
    businessOwnerCount: memberCounts.businessOwnerCount,
    openReportCount,
  };

  return <OverviewView stats={stats} />;
}
