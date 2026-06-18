// Auto-detect the most likely country for a column of phone numbers.
// This is the "AI Empowerment" move: the user shouldn't have to tell us the
// country — the data tells us. We score every configured country by how many
// values it makes valid, and return the best fit with a confidence.

import { listCountries } from "../countries";
import { parsePhone } from "../validators/phone";

export interface PhoneCountryGuess {
  readonly iso: string;
  readonly name: string;
  readonly confidence: number; // share of non-empty samples this country validates
  readonly dialCodeHits: number; // explicit "+91"-style prefixes seen
}

const SAMPLE_LIMIT = 200; // enough to be confident, cheap to compute

export function detectPhoneCountry(values: readonly string[]): PhoneCountryGuess | null {
  const samples = values.map((v) => (v ?? "").trim()).filter((v) => v !== "").slice(0, SAMPLE_LIMIT);
  if (samples.length === 0) return null;

  let best: PhoneCountryGuess | null = null;

  for (const country of listCountries()) {
    let valid = 0;
    let dialHits = 0;
    for (const v of samples) {
      const parsed = parsePhone(v, country.iso);
      if (parsed.isValid) valid += 1;
      if (v.replace(/[^\d+]/g, "").includes(country.dialCode.replace("+", "")) && v.includes("+")) {
        dialHits += 1;
      }
    }
    // Explicit dial codes are a strong signal — let them break ties.
    const confidence = valid / samples.length + dialHits / samples.length / 10;
    if (!best || confidence > best.confidence) {
      best = { iso: country.iso, name: country.name, confidence: Math.min(1, valid / samples.length), dialCodeHits: dialHits };
    }
  }

  return best;
}
