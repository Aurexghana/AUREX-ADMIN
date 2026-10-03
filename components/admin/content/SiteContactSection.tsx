"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerItem, hoverScale } from "@/lib/motion";
import { SpinnerIcon } from "@/components/icons";
import { fetchSiteContact, updateSiteContact, type SiteContact } from "@/lib/siteContact";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth";

const INPUT_CLASSNAME =
  "w-full border border-grid-line bg-panel/60 px-3 py-2 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold/50 focus:outline-none";
const LABEL_CLASSNAME = "flex flex-col gap-1.5";
const LABEL_TEXT_CLASSNAME = "font-sans text-xs uppercase tracking-wide text-cream-dim";

const EMPTY: SiteContact = {
  whatsappNumber: "",
  contactEmail: "",
  facebookUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  updatedAt: "",
};

export default function SiteContactSection() {
  const { session } = useSession();
  const [values, setValues] = useState<SiteContact>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchSiteContact().then((row) => {
      if (cancelled) return;
      if (row) setValues(row);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  function set<K extends keyof SiteContact>(key: K, value: SiteContact[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await updateSiteContact(values);
      setValues(saved);
      setBanner("Contact info updated.");
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Failed to save contact info.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <motion.div variants={staggerItem} className="flex flex-col gap-4 border border-grid-line bg-panel/20 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-jakarta text-lg font-semibold text-cream">Contact & Social Links</h2>
        <p className="font-sans text-sm text-cream-dim">
          Shown on the public site&apos;s footer and contact section. Leave a field blank to hide it there.
        </p>
      </div>

      {banner && (
        <div className="border border-gold/30 bg-gold/5 p-3 font-sans text-sm text-cream-dim">{banner}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-8 font-sans text-sm text-cream-dim">
          <SpinnerIcon className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={LABEL_CLASSNAME}>
              <span className={LABEL_TEXT_CLASSNAME}>WhatsApp Number</span>
              <input
                type="text"
                value={values.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="e.g. +233 20 565 5675"
                className={INPUT_CLASSNAME}
              />
            </label>
            <label className={LABEL_CLASSNAME}>
              <span className={LABEL_TEXT_CLASSNAME}>Email</span>
              <input
                type="email"
                value={values.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="hello@aurexgh.com"
                className={INPUT_CLASSNAME}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className={LABEL_CLASSNAME}>
              <span className={LABEL_TEXT_CLASSNAME}>Facebook URL</span>
              <input
                type="url"
                value={values.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/..."
                className={INPUT_CLASSNAME}
              />
            </label>
            <label className={LABEL_CLASSNAME}>
              <span className={LABEL_TEXT_CLASSNAME}>X (Twitter) URL</span>
              <input
                type="url"
                value={values.twitterUrl}
                onChange={(e) => set("twitterUrl", e.target.value)}
                placeholder="https://x.com/..."
                className={INPUT_CLASSNAME}
              />
            </label>
            <label className={LABEL_CLASSNAME}>
              <span className={LABEL_TEXT_CLASSNAME}>LinkedIn URL</span>
              <input
                type="url"
                value={values.linkedinUrl}
                onChange={(e) => set("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/..."
                className={INPUT_CLASSNAME}
              />
            </label>
          </div>

          <div className="flex items-center justify-end border-t border-grid-line pt-4">
            <motion.button
              {...hoverScale}
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-4 py-2 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <SpinnerIcon className="mx-auto size-4 animate-spin" /> : "Save Changes"}
            </motion.button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
