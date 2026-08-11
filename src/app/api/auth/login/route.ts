import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { normalizeEmail, verifySecret } from "@/lib/auth/crypto";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

/**
 * Public sign-in.
 *
 * Every failure — unknown address, wrong password, deactivated account, or the
 * admin trying to come in this way — returns the same message after the same
 * work, so this endpoint reveals neither which emails have accounts nor that an
 * admin account exists.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const input = schema.parse(await req.json());
    const email = normalizeEmail(input.email);

    const account = await prisma.account.findUnique({ where: { email } });
    const rejected = new HttpError("Those credentials are not valid", 401);

    // Always run a verification, even with no account, to keep timing flat.
    const usable =
      account && account.active && account.role === "USER" && account.passwordHash
        ? account.passwordHash
        : "scrypt$00$00";

    const passwordOk = await verifySecret(input.password, usable);

    if (!account || !account.active || account.role !== "USER" || !passwordOk) {
      throw rejected;
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signSession({
      sub: account.id,
      email: account.email,
      name: account.name,
      role: "USER",
      v: account.tokenVersion,
    });
    await setSessionCookie(token);

    return {
      account: { id: account.id, email: account.email, name: account.name, role: "USER" },
    };
  });
}
