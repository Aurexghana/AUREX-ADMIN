import { apiFetch } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";

export type SiteContact = {
  whatsappNumber: string;
  contactEmail: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  updatedAt: string;
};

type SiteContactApiRow = {
  whatsapp_number: string | null;
  contact_email: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  updated_at: string;
};

function toSiteContact(row: SiteContactApiRow): SiteContact {
  return {
    whatsappNumber: row.whatsapp_number ?? "",
    contactEmail: row.contact_email ?? "",
    facebookUrl: row.facebook_url ?? "",
    twitterUrl: row.twitter_url ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    updatedAt: row.updated_at.slice(0, 10),
  };
}

export async function fetchSiteContact(): Promise<SiteContact | undefined> {
  try {
    const { data } = await cached("site-contact:", () => apiFetch<SiteContactApiRow>("/site-contact"));
    return toSiteContact(data);
  } catch {
    return undefined;
  }
}

export async function updateSiteContact(input: {
  whatsappNumber: string;
  contactEmail: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
}): Promise<SiteContact> {
  const { data } = await apiFetch<SiteContactApiRow>("/site-contact", {
    method: "PATCH",
    body: {
      whatsapp_number: input.whatsappNumber,
      contact_email: input.contactEmail,
      facebook_url: input.facebookUrl,
      twitter_url: input.twitterUrl,
      linkedin_url: input.linkedinUrl,
    },
  });
  invalidate("site-contact");
  return toSiteContact(data);
}
