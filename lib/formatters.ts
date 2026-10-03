/**
 * Tiny display-formatting helpers, same convention as the main AUREX
 * site's own lib/formatters.ts (GHS currency, day-month-year dates) -
 * reproduced here since this is a separate repo, not shared code.
 */

/** e.g. 12000 -> "GHS 12,000". */
export function formatGhs(amount: number): string {
  return `GHS ${Math.round(amount).toLocaleString("en-US")}`;
}

/** e.g. "2026-03-30" -> "30 Mar 2026". */
export function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** e.g. "2026-03-30T14:05:00Z" -> "30 Mar 2026, 14:05". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Builds a wa.me deep link from a member's phone-on-file, optionally
 * prefilled with a message - same "hand off to WhatsApp, no real
 * messaging backend" stub as the main site's own investment flow. wa.me
 * wants digits only (no "+", spaces, or dashes), hence the strip.
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
