// Amount validation for payment/order values. Strips currency symbols and
// thousands separators, flags negatives and non-numeric junk.

export interface AmountParse {
  readonly isValid: boolean;
  readonly value?: number;
  readonly reason?: string;
  readonly normalized?: string; // plain decimal string, e.g. "1299.00"
}

const CURRENCY = /[₹$€£,\s]/g;

export function parseAmount(raw: string): AmountParse {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return { isValid: false, reason: "Empty amount" };

  const cleaned = trimmed.replace(CURRENCY, "");
  if (!/^[+-]?\d*\.?\d+$/.test(cleaned)) {
    return { isValid: false, reason: "Not a valid number" };
  }

  const value = Number(cleaned);
  if (Number.isNaN(value)) return { isValid: false, reason: "Not a valid number" };
  if (value < 0) {
    return { isValid: false, value, reason: "Negative amount", normalized: Math.abs(value).toFixed(2) };
  }

  return { isValid: true, value, normalized: value.toFixed(2) };
}
