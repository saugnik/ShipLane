import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 32;

/**
 * Password/OTP hashing.
 *
 * scrypt is memory-hard, so a leaked hash cannot be brute-forced at GPU speed —
 * which matters most for the six-digit OTP, whose keyspace is only 10^6.
 * Comparison is constant-time; a plain `===` would leak the matching prefix
 * length through timing.
 */
export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(secret, salt, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(secret, Buffer.from(saltHex, "hex"), expected.length);

  // Lengths must match before timingSafeEqual, which throws otherwise.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Cryptographically uniform 6-digit code — Math.random() is not acceptable here. */
export function generateOtp(): string {
  // Rejection sampling keeps every code equally likely; a plain modulo would
  // bias the low end of the range.
  const limit = 1_000_000;
  const max = Math.floor(0xffffffff / limit) * limit;
  let n: number;
  do {
    n = randomBytes(4).readUInt32BE(0);
  } while (n >= max);
  return String(n % limit).padStart(6, "0");
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
