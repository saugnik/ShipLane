import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { generateOtp, hashSecret, verifySecret } from "@/lib/auth/crypto";

/**
 * Email ownership proof.
 *
 * `checkEmail` proves an address is deliverable; this proves the person at the
 * keyboard can read it. The two are deliberately separate steps — deliverable
 * is not the same as owned, and conflating them is how signup flows end up
 * letting anyone register any address.
 *
 * On success the caller gets a short-lived signed token rather than a session:
 * registration consumes it, so a verified code cannot be replayed and cannot be
 * traded for anything other than an account on that exact address.
 */

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

/** Per-address send throttle. Enough for a resend or two, not for a mail bomb. */
const SEND_WINDOW_MINUTES = 15;
const MAX_SENDS_PER_WINDOW = 5;
/** Minimum gap between sends, so "resend" cannot be held down. */
const RESEND_COOLDOWN_SECONDS = 30;

const VERIFICATION_TTL = "20m";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; error: string; retryAfterSeconds?: number };

/**
 * Creates a code for the address, invalidating any earlier live one.
 *
 * Returns the plaintext code for the caller to deliver — it is never stored in
 * the clear and never returned to the browser unless the mailer is in echo mode.
 */
export async function issueOtp(email: string, purpose: string): Promise<IssueResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - SEND_WINDOW_MINUTES * 60_000);

  const recent = await prisma.emailOtp.findMany({
    where: { email, purpose, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent.length >= MAX_SENDS_PER_WINDOW) {
    return {
      ok: false,
      error: `Too many codes requested. Try again in ${SEND_WINDOW_MINUTES} minutes.`,
    };
  }

  const last = recent[0];
  if (last) {
    const elapsed = (now.getTime() - last.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      return { ok: false, error: `Wait ${wait}s before requesting another code.`, retryAfterSeconds: wait };
    }
  }

  const code = generateOtp();

  // Retire any live code first: two valid codes at once doubles the guessing
  // surface for no benefit to the user.
  await prisma.emailOtp.updateMany({
    where: { email, purpose, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });

  await prisma.emailOtp.create({
    data: {
      email,
      purpose,
      codeHash: await hashSecret(code),
      expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60_000),
    },
  });

  return { ok: true, code };
}

export type VerifyResult = { ok: true; token: string } | { ok: false; error: string };

export async function verifyOtp(
  email: string,
  code: string,
  purpose: string,
): Promise<VerifyResult> {
  const now = new Date();

  const record = await prisma.emailOtp.findFirst({
    where: { email, purpose, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, error: "That code has expired. Request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    // Burn it rather than leaving a dead row that keeps matching the query.
    await prisma.emailOtp.update({ where: { id: record.id }, data: { consumedAt: now } });
    return { ok: false, error: "Too many incorrect attempts. Request a new code." };
  }

  if (!(await verifySecret(code.trim(), record.codeHash))) {
    const attempts = record.attempts + 1;
    await prisma.emailOtp.update({ where: { id: record.id }, data: { attempts } });
    const left = MAX_ATTEMPTS - attempts;
    return {
      ok: false,
      error: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Request a new code.",
    };
  }

  await prisma.emailOtp.update({ where: { id: record.id }, data: { consumedAt: now } });

  const token = await new SignJWT({ email, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(VERIFICATION_TTL)
    .sign(secret());

  return { ok: true, token };
}

/**
 * Confirms a verification token was issued by us, for this address and purpose.
 * Registration calls this before it will create anything.
 */
export async function readVerification(
  token: string | undefined,
  email: string,
  purpose: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub === email && payload.purpose === purpose;
  } catch {
    return false;
  }
}
