import type { Metadata } from "next";
import OverviewView from "@/components/admin/overview/OverviewView";

export const metadata: Metadata = {
  title: "Overview | AUREX Admin",
};

export default function OverviewPage() {
  return <OverviewView />;
}
