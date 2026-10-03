import { getCountries } from "libphonenumber-js/min";

export type Country = { code: string; name: string };

let cached: Country[] | null = null;

export function getCountryList(): Country[] {
  if (cached) return cached;

  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

  cached = getCountries()
    .map((code) => ({ code, name: displayNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return cached;
}
