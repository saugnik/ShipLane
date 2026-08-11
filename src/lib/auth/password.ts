/**
 * Password rules.
 *
 * Length does far more work than character-class requirements, so the floor is
 * 8 with a nudge toward longer, and the only hard rejections are passwords that
 * are trivially guessable or derived from the account itself.
 */

/** The handful that show up first in every credential-stuffing list. */
const BANNED = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyuiop", "iloveyou", "admin123", "welcome1", "welcome123",
  "letmein1", "abc12345", "passw0rd", "p@ssw0rd", "shiplane", "shiplane123",
  "changeme", "secret123", "india123", "test1234",
]);

export type PasswordCheck = { ok: true } | { ok: false; error: string };

export function checkPassword(password: string, context: { email?: string; name?: string } = {}): PasswordCheck {
  if (password.length < 8) {
    return { ok: false, error: "Use at least 8 characters" };
  }
  if (password.length > 200) {
    return { ok: false, error: "That password is too long" };
  }

  const lower = password.toLowerCase();

  if (BANNED.has(lower)) {
    return { ok: false, error: "That password is too common. Pick something less guessable." };
  }

  // A password built from the address is public knowledge the moment the email is.
  const localPart = context.email?.split("@")[0]?.toLowerCase();
  if (localPart && localPart.length >= 4 && lower.includes(localPart)) {
    return { ok: false, error: "Your password should not contain your email address" };
  }

  const firstName = context.name?.trim().split(/\s+/)[0]?.toLowerCase();
  if (firstName && firstName.length >= 4 && lower.includes(firstName)) {
    return { ok: false, error: "Your password should not contain your name" };
  }

  // A single repeated character reaches any length requirement while carrying
  // almost no entropy.
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, error: "That password is too simple" };
  }

  return { ok: true };
}

/** 0-4, for the strength meter. Advisory only — `checkPassword` is the gate. */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
}

export const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];
