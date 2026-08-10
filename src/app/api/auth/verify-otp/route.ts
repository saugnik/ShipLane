import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth/crypto";
import { verifyOtp } from "@/lib/auth/otp";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email(),
  purpose: z.enum(["LOGIN", "REGISTER"]),
  code: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

export async function POST(req: Request) {
  return handle(async () => {
    const input = schema.parse(await req.json());
    const email = normalizeEmail(input.email);

    const result = await verifyOtp(email, input.purpose, input.code);
    if (!result.ok) throw new HttpError(result.error, 401);

    let account = await prisma.account.findUnique({ where: { email } });

    if (input.purpose === "REGISTER") {
      if (account) throw new HttpError("An account with that email already exists.", 409);

      const payload = (result.payload ?? {}) as {
        name?: string;
        company?: string | null;
        phone?: string | null;
      };

      account = await prisma.account.create({
        data: {
          email,
          name: payload.name?.trim() || email.split("@")[0],
          company: payload.company ?? null,
          phone: payload.phone ?? null,
          role: "USER", // the admin is seeded, never registered
        },
      });
    }

    if (!account || !account.active) {
      throw new HttpError("We could not find an active account for that email.", 404);
    }
    if (account.role === "ADMIN") {
      throw new HttpError("We could not find an active account for that email.", 404);
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
      account: { id: account.id, email: account.email, name: account.name, role: account.role },
    };
  });
}
