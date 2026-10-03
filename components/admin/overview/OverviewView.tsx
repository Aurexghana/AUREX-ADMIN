"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, scrollReveal } from "@/lib/motion";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import { InboxIcon, UsersIcon, LayersIcon, BriefcaseIcon, BookIcon } from "@/components/icons";
import TrendChart from "@/components/admin/overview/charts/TrendChart";
import SegmentedBar from "@/components/admin/overview/charts/SegmentedBar";
import PackagePieChart from "@/components/admin/overview/charts/PackagePieChart";
import { useSession } from "@/lib/auth";
import { getApplications, getPendingApplicationCount } from "@/lib/applications";
import {
  fetchInvestedByPackage,
  fetchMonthlyInvestedTrend,
  type MonthlyInvestedPoint,
  type PackageAllocation,
} from "@/lib/investments";
import { fetchAdminPackages } from "@/lib/packages";
import { fetchBusinessListings } from "@/lib/businessListings";
import { getMemberCounts } from "@/lib/members";
import { getOpenReportCount } from "@/lib/reports";

export type ApplicationStatusCounts = { pending: number; approved: number; rejected: number };

const EMPTY_APPLICATION_STATUS_COUNTS: ApplicationStatusCounts = { pending: 0, approved: 0, rejected: 0 };
const EMPTY_PACKAGE_ALLOCATION: PackageAllocation = { core: 0, ventures: 0 };

/**
 * The Admin landing page. Two rows below the header, each pairing a
 * "main" element with supporting detail beside it:
 *
 *   1. The stat tiles (no "Total Invested" tile — the trend chart below
 *      already answers that, as its own always-visible endpoint label,
 *      so the number isn't dropped, just not duplicated) beside the
 *      package-allocation pie chart. Five tiles, not four — the odd one
 *      out ("Open Reports", the Report/Complaint Inbox's own tie-in
 *      here) spans both columns on its own row rather than leaving a
 *      lopsided half-empty row in the 2-column grid.
 *   2. The invested-over-time trend chart beside the applications-by-
 *      status and members-by-track breakdowns, stacked in a column.
 *
 * No "Funding Progress by Listing" here anymore — the Business Listings
 * page itself already shows raised/goal per listing; this page stays
 * about platform-wide shape (where members come from, where money goes),
 * not a duplicate of that list.
 *
 * `staggerContainer`/`staggerItem` for the header + stat tiles (same
 * shared-variant convention as the main site's own list sections);
 * `scrollReveal` for the two chart rows below, per the brief's own
 * guidance for a page long enough to benefit from content revealing as
 * you scroll. See the dataviz skill's own reasoning (in each chart
 * component) for why the color choices are what they are — this brand
 * has one real hue (gold) plus its already-established green/red status
 * pair, not an invented multi-hue categorical palette.
 */
export default function OverviewView() {
  const { session } = useSession();
  const [pendingApplications, setPendingApplications] = useState(0);
  const [applicationStatusCounts, setApplicationStatusCounts] = useState(EMPTY_APPLICATION_STATUS_COUNTS);
  const [investedTrend, setInvestedTrend] = useState<MonthlyInvestedPoint[]>([]);
  const [packageAllocation, setPackageAllocation] = useState<PackageAllocation>(EMPTY_PACKAGE_ALLOCATION);
  const [openSlotCount, setOpenSlotCount] = useState(0);
  const [liveListingCount, setLiveListingCount] = useState(0);
  const [investorCount, setInvestorCount] = useState(0);
  const [businessOwnerCount, setBusinessOwnerCount] = useState(0);
  const [openReportCount, setOpenReportCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    Promise.all([
      getApplications(),
      getPendingApplicationCount(),
      fetchMonthlyInvestedTrend(),
      fetchInvestedByPackage(),
      fetchAdminPackages(),
      fetchBusinessListings(),
      getMemberCounts(),
      getOpenReportCount(),
    ]).then(([applications, pending, trend, allocation, packages, listings, memberCounts, openReports]) => {
      if (cancelled) return;
      setPendingApplications(pending);
      setApplicationStatusCounts({
        pending: applications.filter((a) => a.status === "pending").length,
        approved: applications.filter((a) => a.status === "approved").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
      });
      setInvestedTrend(trend);
      setPackageAllocation(allocation);
      setOpenSlotCount(packages.filter((p) => p.status === "active").length);
      setLiveListingCount(listings.filter((l) => l.status === "live").length);
      setInvestorCount(memberCounts.investorCount);
      setBusinessOwnerCount(memberCounts.businessOwnerCount);
      setOpenReportCount(openReports);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const totalMembers = investorCount + businessOwnerCount;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader title="Overview" description="A snapshot of the AUREX platform right now." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Pending Applications"
            value={String(pendingApplications)}
            href="/applications?status=pending"
            sublabel="Awaiting review"
            icon={InboxIcon}
          />
          <StatCard
            label="Registered Members"
            value={String(totalMembers)}
            href="/members"
            sublabel={`${investorCount} Investors · ${businessOwnerCount} Business Owners`}
            icon={UsersIcon}
          />
          <StatCard
            label="Open Investment Slots"
            value={String(openSlotCount)}
            href="/slots?status=active"
            sublabel="Currently accepting investment"
            icon={LayersIcon}
          />
          <StatCard
            label="Live Business Listings"
            value={String(liveListingCount)}
            href="/listings?status=live"
            sublabel="Raising funds now"
            icon={BriefcaseIcon}
          />
          <div className="sm:col-span-2">
            <StatCard
              label="Open Reports"
              value={String(openReportCount)}
              href="/reports?status=open"
              sublabel="Awaiting a first response"
              icon={BookIcon}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border border-gold/20 bg-panel/40 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Investment Allocation by Package</h2>
          <PackagePieChart allocation={packageAllocation} />
        </div>
      </div>

      <motion.div {...scrollReveal} className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-1.5 border border-gold/20 bg-panel/40 p-6">
          <h2 className="font-jakarta text-lg font-semibold text-cream">Total Invested Over Time</h2>
          <p className="mb-3 font-sans text-sm text-cream-dim">Cumulative amount invested, platform-wide.</p>
          <TrendChart data={investedTrend} />
        </div>

        {/* This column stretches to match the trend chart's height (the
            grid row's default align-items: stretch), and each card below
            is flex-1 so the pair splits that full height evenly instead
            of sitting shorter with dead space underneath — the segmented
            bar itself stays a "thin mark" per the dataviz mark spec;
            it's the card's height, not the bar's, that now matches. */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-1 flex-col gap-1.5 border border-gold/20 bg-panel/40 p-6">
            <h2 className="font-jakarta text-lg font-semibold text-cream">Applications by Status</h2>
            <p className="font-sans text-sm text-cream-dim">Every application ever submitted.</p>
            <div className="flex flex-1 flex-col justify-center">
              <SegmentedBar
                ariaLabel={`Applications by status: ${applicationStatusCounts.pending} pending, ${applicationStatusCounts.approved} approved, ${applicationStatusCounts.rejected} rejected`}
                segments={[
                  { key: "pending", label: "Pending", value: applicationStatusCounts.pending, colorClassName: "bg-cream-dim" },
                  { key: "approved", label: "Approved", value: applicationStatusCounts.approved, colorClassName: "bg-[#4ade80]" },
                  { key: "rejected", label: "Rejected", value: applicationStatusCounts.rejected, colorClassName: "bg-[#f87171]" },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5 border border-gold/20 bg-panel/40 p-6">
            <h2 className="font-jakarta text-lg font-semibold text-cream">Members by Track</h2>
            <p className="font-sans text-sm text-cream-dim">Registered investors vs. business owners.</p>
            <div className="flex flex-1 flex-col justify-center">
              <SegmentedBar
                ariaLabel={`Members by track: ${investorCount} investors, ${businessOwnerCount} business owners`}
                segments={[
                  { key: "investor", label: "Investors", value: investorCount, colorClassName: "bg-gold-deep" },
                  { key: "business", label: "Business Owners", value: businessOwnerCount, colorClassName: "bg-cream-dim" },
                ]}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
