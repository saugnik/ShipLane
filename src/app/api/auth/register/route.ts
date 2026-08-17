import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { hashSecret } from "@/lib/auth/crypto";
import { checkEmail } from "@/lib/auth/email";
import { readVerification } from "@/lib/auth/otp";
import { checkPassword } from "@/lib/auth/password";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().min(1),
  name: z.string().trim().min(1, "Enter your name").max(120),
  company: z.string().trim().max(160).optional(),
  phone: z
    .union([z.literal(""), z.string().trim().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile")])
    .optional(),
  password: z.string().min(1, "Choose a password"),
  verificationToken: z.string().min(1, "Verify your email address first"),
});

export async function POST(req: Request) {
  return handle(async () => {
    const input = schema.parse(await req.json());

    // Re-run the address check server-side. The client already called
    // /check-email, but that result is a hint, not a permission.
    const email = await checkEmail(input.email);
    if (!email.ok) throw new HttpError(email.error, 422);

    // Ownership, not just deliverability. Without a token signed by us for this
    // exact address, anyone could register any address they can spell.
    const verified = await readVerification(input.verificationToken, email.email, "REGISTER");
    if (!verified) {
      throw new HttpError("Your email verification has expired. Request a new code.", 403);
    }

    const password = checkPassword(input.password, { email: email.email, name: input.name });
    if (!password.ok) throw new HttpError(password.error, 422);

    const existing = await prisma.account.findUnique({
      where: { email: email.email },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError("An account with that email already exists. Sign in instead.", 409);
    }

    const account = await prisma.account.create({
      data: {
        email: email.email,
        name: input.name.trim(),
        company: input.company?.trim() || null,
        phone: input.phone?.trim() || null,
        role: "USER", // the admin is seeded, never registered
        passwordHash: await hashSecret(input.password),
        lastLoginAt: new Date(),
      },
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
