// Country-aware phone validation. Returns a normalized national number and a
// clear verdict, so both the validator and the auto-detector can reuse it.

import { CountryRule, getCountryRule } from "../countries";

export interface PhoneParse {
  readonly raw: string;
  readonly digits: string; // all digits, dial code stripped if recognized
  readonly matchedDial?: string; // e.g. "+91" if we recognized a prefix
  readonly isValid: boolean;
  readonly reason?: string; // why invalid, plain English
  /** E.164-style normalized value, e.g. "+919876543210", when valid/fixable. */
  readonly normalized?: string;
}

const NON_DIGIT = /[^\d]/g;

/** Strip a recognized dial code (with or without +, or a 00 prefix) off the front. */
function stripDialCode(allDigits: string, rule: CountryRule): { national: string; matched?: string } {
  const dial = rule.dialCode.replace("+", "");
  // International 00 prefix → treat as +.
  const trimmed = allDigits.startsWith("00") ? allDigits.slice(2) : allDigits;
  if (trimmed.startsWith(dial) && trimmed.length > rule.nationalDigits) {
    return { national: trimmed.slice(dial.length), matched: rule.dialCode };
  }
  // A single leading trunk "0" (common in IN/GB exports) before the national number.
  if (allDigits.length === rule.nationalDigits + 1 && allDigits.startsWith("0")) {
    return { national: allDigits.slice(1) };
  }
  return { national: allDigits };
}

export function parsePhone(raw: string, countryIso: string): PhoneParse {
  const rule = getCountryRule(countryIso);
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") {
    return { raw, digits: "", isValid: false, reason: "Empty phone number" };
  }

  const hadPlus = trimmed.startsWith("+");
  const allDigits = trimmed.replace(NON_DIGIT, "");
  const { national, matched } = stripDialCode(allDigits, rule);

  if (national.length !== rule.nationalDigits) {
    return {
      raw,
      digits: national,
      matchedDial: hadPlus ? rule.dialCode : matched,
      isValid: false,
      reason: `Expected ${rule.nationalDigits} digits for ${rule.name}, found ${national.length}`,
    };
  }

  if (rule.validStartDigits && !rule.validStartDigits.some((d) => national.startsWith(d))) {
    return {
      raw,
      digits: national,
      matchedDial: matched,
      isValid: false,
      reason: `${rule.name} numbers don't start with "${national[0]}"`,
      normalized: `${rule.dialCode}${national}`, // length is right; offer it anyway
    };
  }

  return {
    raw,
    digits: national,
    matchedDial: matched ?? (hadPlus ? rule.dialCode : undefined),
    isValid: true,
    normalized: `${rule.dialCode}${national}`,
  };
}
