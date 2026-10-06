/**
 * Column layouts, templates and per-row validation for the bulk Investor
 * and bulk Business imports. Validation mirrors the single-add forms
 * (components/admin/members/MemberForm.tsx, businesses/BusinessForm.tsx).
 */

import { getCountryList } from "@/lib/countries";
import type { NewInvestorInput, Member } from "@/lib/members";
import type { CreateBusinessInput } from "@/lib/businesses";
import { CATEGORY_OPTIONS } from "@/components/admin/businesses/BusinessForm";
import type { ParsedRow } from "@/components/admin/BulkImportModal";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts a country as its ISO code ("GH") or its English name ("Ghana"). */
function resolveCountryCode(input: string): string | null {
  const needle = input.trim().toLowerCase();
  if (!needle) return null;
  const match = getCountryList().find((c) => c.code.toLowerCase() === needle || c.name.toLowerCase() === needle);
  return match?.code ?? null;
}

function validateInvestorFields(record: Record<string, string>, prefix: string): { value: NewInvestorInput } | { error: string } {
  const get = (key: string) => record[`${prefix}${key}`] ?? "";
  const nickname = get("nickname");
  const realName = get("real_name");
  const email = get("email");
  const phone = get("phone");
  const country = resolveCountryCode(get("country"));

  if (nickname.length < 3 || nickname.length > 20) return { error: "Nickname must be 3 to 20 characters." };
  if (!realName) return { error: "Real name is required." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Email is missing or not valid." };
  if (!phone) return { error: "Phone is required." };
  if (!country) return { error: "Country isn't recognised. Use its name (Ghana) or ISO code (GH)." };
  return { value: { nickname, realName, email, phone, country } };
}

// ---- Investors -----------------------------------------------------------

export const INVESTOR_TEMPLATE_ROWS: string[][] = [
  ["nickname", "real_name", "email", "phone", "country"],
  ["IronVault", "Kwame Mensah", "kwame.mensah@example.com", "+233241112222", "Ghana"],
  ["NorthStar", "Amara Okafor", "amara.okafor@example.com", "+2348031234567", "NG"],
];

export const INVESTOR_REQUIRED_HEADERS = ["nickname", "real_name", "email", "phone", "country"];

export const INVESTOR_COLUMN_HELP = [
  "nickname: 3 to 20 characters",
  "phone: include the country code, e.g. +233241112222",
  "country: full name (Ghana) or 2-letter code (GH)",
];

export function parseInvestorRow(record: Record<string, string>): ParsedRow<NewInvestorInput> {
  const result = validateInvestorFields(record, "");
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true, value: result.value, label: `${result.value.nickname} (${result.value.realName})` };
}

// ---- Businesses ----------------------------------------------------------

export const BUSINESS_TEMPLATE_ROWS: string[][] = [
  [
    "name",
    "category",
    "description",
    "owner_type",
    "owner_member",
    "owner_nickname",
    "owner_real_name",
    "owner_email",
    "owner_phone",
    "owner_country",
  ],
  ["Green Harvest Foods", "Agriculture", "Farm-to-market produce", "admin", "", "", "", "", "", ""],
  ["Swift Haul", "Logistics", "Last-mile delivery", "existing", "IronVault", "", "", "", "", ""],
  ["Bright Wares", "Retail", "", "new", "", "HarvestHQ", "Abena Sarpong", "abena@example.com", "+233240000000", "Ghana"],
];

export const BUSINESS_REQUIRED_HEADERS = ["name", "category", "owner_type"];

export const BUSINESS_COLUMN_HELP = [
  `category: one of ${CATEGORY_OPTIONS.filter((o) => o.value).map((o) => o.value).join(", ")}`,
  "owner_type: admin, existing or new",
  "existing: put the member's nickname or email in owner_member",
  "new: fill every owner_ column (nickname, real name, email, phone, country); that person is invited as an investor",
];

export function makeBusinessRowParser(members: Member[]) {
  return function parseBusinessRow(record: Record<string, string>): ParsedRow<CreateBusinessInput> {
    const name = record.name;
    if (!name) return { ok: false, error: "Business name is required." };

    const category = CATEGORY_OPTIONS.find((o) => o.value && o.value.toLowerCase() === (record.category ?? "").toLowerCase())?.value;
    if (!category) return { ok: false, error: "Category isn't one of the allowed values (see the template)." };

    const base = { name, category, description: record.description ?? "" };
    const ownerType = (record.owner_type ?? "").toLowerCase();

    if (ownerType === "admin") {
      return { ok: true, label: name, value: { ...base, ownerType: "admin" } };
    }

    if (ownerType === "existing") {
      const needle = (record.owner_member ?? "").toLowerCase();
      if (!needle) return { ok: false, error: "owner_member is required when owner_type is existing." };
      const owner = members.find((m) => m.nickname.toLowerCase() === needle || (m.email && m.email.toLowerCase() === needle));
      if (!owner) return { ok: false, error: `No existing investor matches “${record.owner_member}”.` };
      return { ok: true, label: name, value: { ...base, ownerType: "member", ownerMemberId: owner.id } };
    }

    if (ownerType === "new") {
      const result = validateInvestorFields(record, "owner_");
      if ("error" in result) return { ok: false, error: `New owner: ${result.error}` };
      return { ok: true, label: name, value: { ...base, ownerType: "member", newOwner: result.value } };
    }

    return { ok: false, error: "owner_type must be admin, existing or new." };
  };
}
