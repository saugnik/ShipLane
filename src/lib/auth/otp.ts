import { prisma } from "@/lib/db";
import { generateOtp, hashSecret, normalizeEmail, verifySecret } from "@/lib/auth/crypto";
import { deliverOtp, otpIsEchoed } from "@/lib/auth/mailer";

/**
 * One-time codes.
 *
 * The code is never stored — only a scrypt hash — so a database leak cannot be
 * replayed. Three defences bound brute force: a 10-minute expiry, a hard cap of
 * 5 verification attempts per code, and a per-email issue throttle.
 */

export const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MIN_SECONDS_BETWEEN_SENDS = 45;
const MAX_PER_HOUR = 6;

export type OtpPurpose = "LOGIN" | "REGISTER";

export type IssueResult =
  | { ok: true; expiresAt: Date; devCode?: string }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function issueOtp(
  rawEmail: string,
  purpose: OtpPurpose,
  payload?: Record<string, unknown>,
): Promise<IssueResult> {
  const email = normalizeEmail(rawEmail);
  const now = new Date();

  const recent = await prisma.otpToken.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const elapsed = (now.getTime() - recent.createdAt.getTime()) / 1000;
    if (elapsed < MIN_SECONDS_BETWEEN_SENDS) {
      return {
        ok: false,
        error: "A code was just sent. Please wait before requesting another.",
        retryAfterSeconds: Math.ceil(MIN_SECONDS_BETWEEN_SENDS - elapsed),
      };
    }
  }

  const lastHour = await prisma.otpToken.count({
    where: { email, createdAt: { gt: new Date(now.getTime() - 3_600_000) } },
  });
  if (lastHour >= MAX_PER_HOUR) {
    return { ok: false, error: "Too many codes requested. Try again in an hour." };
  }

  // Any earlier code for this email/purpose is dead the moment a new one issues.
  await prisma.otpToken.deleteMany({ where: { email, purpose, consumedAt: null } });

  const code = generateOtp();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);

  await prisma.otpToken.create({
    data: {
      email,
      purpose,
      codeHash: await hashSecret(code),
      payload: payload ? JSON.stringify(payload) : null,
      expiresAt,
    },
  });

  await deliverOtp(email, code, purpose);

  // Echoed only when no mail provider is configured, so the demo stays usable.
  return { ok: true, expiresAt, ...(otpIsEchoed() ? { devCode: code } : {}) };
}

export type VerifyResult =
  | { ok: true; payload: Record<string, unknown> | null }
  | { ok: false; error: string };

export async function verifyOtp(
  rawEmail: string,
  purpose: OtpPurpose,
  code: string,
): Promise<VerifyResult> {
  const email = normalizeEmail(rawEmail);

  const token = await prisma.otpToken.findFirst({
    where: { email, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  // Same message whether the code is wrong or absent — a distinct "no code was
  // requested" reply would confirm which emails have accounts.
  const invalid = { ok: false as const, error: "That code is not valid. Check it and try again." };

  if (!token) return invalid;

  if (token.expiresAt < new Date()) {
    await prisma.otpToken.delete({ where: { id: token.id } });
    return { ok: false, error: "That code has expired. Request a new one." };
  }

  if (token.attempts >= MAX_ATTEMPTS) {
    await prisma.otpToken.delete({ where: { id: token.id } });
    return { ok: false, error: "Too many incorrect attempts. Request a new code." };
  }

  if (!(await verifySecret(code.trim(), token.codeHash))) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return invalid;
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, payload: token.payload ? JSON.parse(token.payload) : null };
}

/** Housekeeping — expired codes carry no value and should not linger. */
export async function purgeExpiredOtps() {
  await prisma.otpToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
