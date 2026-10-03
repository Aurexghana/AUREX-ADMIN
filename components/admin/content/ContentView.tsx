"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import PageHeader from "@/components/admin/PageHeader";
import SiteContactSection from "@/components/admin/content/SiteContactSection";
import TestimonialsSection from "@/components/admin/content/TestimonialsSection";
import AnnouncementBlocksSection from "@/components/admin/content/AnnouncementBlocksSection";

export default function ContentView() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10"
    >
      <PageHeader title="Home Page Content" description="Everything shown on the public AUREX homepage." />

      <SiteContactSection />
      <TestimonialsSection />
      <AnnouncementBlocksSection />
    </motion.div>
  );
}
