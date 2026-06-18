// Email validation. Pragmatic, not RFC-exhaustive: catches the real-world
// breakage in client exports (missing @, spaces, double dots, trailing junk).

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailParse {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly normalized?: string; // lowercased + trimmed
}

export function parseEmail(raw: string): EmailParse {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return { isValid: false, reason: "Empty email" };

  const lower = trimmed.toLowerCase();
  if (/\s/.test(trimmed)) return { isValid: false, reason: "Email contains spaces", normalized: lower.replace(/\s/g, "") };
  if (trimmed.includes("..")) return { isValid: false, reason: "Email has consecutive dots" };
  if (!EMAIL_RX.test(lower)) return { isValid: false, reason: "Not a valid email address" };

  return { isValid: true, normalized: lower };
}
