import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { normalizeEmail, verifySecret } from "@/lib/auth/crypto";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Enter your password"),
});

/**
 * The single admin sign-in. Password-based rather than OTP, because the admin
 * is a seeded operations account with no self-service registration path.
 *
 * Every failure returns the same message and takes roughly the same time, so
 * this endpoint cannot be used to discover the admin address.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const input = schema.parse(await req.json());
    const email = normalizeEmail(input.email);

    const account = await prisma.account.findUnique({ where: { email } });
    const rejected = new HttpError("Those credentials are not valid", 401);

    // Always run a verification, even with no account, to keep the timing flat.
    const hash =
      account?.role === "ADMIN" && account.active && account.passwordHash
        ? account.passwordHash
        : "scrypt$00$00";

    const passwordOk = await verifySecret(input.password, hash);
    if (!account || account.role !== "ADMIN" || !account.active || !passwordOk) throw rejected;

    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signSession({
      sub: account.id,
      email: account.email,
      name: account.name,
      role: "ADMIN",
      v: account.tokenVersion,
    });
    await setSessionCookie(token);

    return { account: { id: account.id, email: account.email, name: account.name, role: "ADMIN" } };
  });
}
