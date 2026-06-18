// Configurable country rules. The brief explicitly asks for phone validation
// "driven by configurable country codes" — so this is the single source of
// truth. Add a country = add one entry here, nothing else changes.

export interface CountryRule {
  readonly iso: string; // ISO-3166 alpha-2
  readonly name: string;
  readonly dialCode: string; // e.g. "+91"
  readonly nationalDigits: number; // digits AFTER the dial code
  /** Leading digits a valid national number may start with (mobile-ish). */
  readonly validStartDigits?: readonly string[];
}

// Keyed by ISO for O(1) lookup. Ordered roughly by how likely we are to see
// each in a typical Xeno client export.
export const COUNTRY_RULES: Readonly<Record<string, CountryRule>> = {
  IN: { iso: "IN", name: "India", dialCode: "+91", nationalDigits: 10, validStartDigits: ["6", "7", "8", "9"] },
  SG: { iso: "SG", name: "Singapore", dialCode: "+65", nationalDigits: 8, validStartDigits: ["8", "9", "6", "3"] },
  US: { iso: "US", name: "United States", dialCode: "+1", nationalDigits: 10 },
  GB: { iso: "GB", name: "United Kingdom", dialCode: "+44", nationalDigits: 10 },
  AE: { iso: "AE", name: "UAE", dialCode: "+971", nationalDigits: 9, validStartDigits: ["5"] },
  AU: { iso: "AU", name: "Australia", dialCode: "+61", nationalDigits: 9, validStartDigits: ["4"] },
};

export const DEFAULT_COUNTRY = "IN";

const FALLBACK_RULE = COUNTRY_RULES[DEFAULT_COUNTRY]!;

/** Always returns a rule — unknown ISO codes fall back to the default country. */
export function getCountryRule(iso: string): CountryRule {
  return COUNTRY_RULES[iso] ?? FALLBACK_RULE;
}

export function countryByDialCode(dial: string): CountryRule | undefined {
  return Object.values(COUNTRY_RULES).find((c) => c.dialCode === dial);
}

export function listCountries(): readonly CountryRule[] {
  return Object.values(COUNTRY_RULES);
}
