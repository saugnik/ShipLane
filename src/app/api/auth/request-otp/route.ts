import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth/crypto";
import { issueOtp } from "@/lib/auth/otp";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  purpose: z.enum(["LOGIN", "REGISTER"]),
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  phone: z
    .union([z.literal(""), z.string().trim().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile")])
    .optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const input = schema.parse(await req.json());
    const email = normalizeEmail(input.email);

    const existing = await prisma.account.findUnique({
      where: { email },
      select: { id: true, active: true, role: true },
    });

    if (input.purpose === "REGISTER") {
      if (existing) {
        throw new HttpError("An account with that email already exists. Sign in instead.", 409);
      }
      if (!input.name?.trim()) {
        throw new HttpError("Please tell us your name", 422);
      }
    } else {
      // Deliberately vague: confirming which emails have accounts would let
      // anyone enumerate the customer list.
      if (!existing || !existing.active) {
        throw new HttpError("We could not find an active account for that email.", 404);
      }
      // The admin never signs in through the public OTP screen.
      if (existing.role === "ADMIN") {
        throw new HttpError("We could not find an active account for that email.", 404);
      }
    }

    const result = await issueOtp(email, input.purpose, {
      name: input.name?.trim(),
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
    });

    if (!result.ok) throw new HttpError(result.error, 429);

    return {
      sent: true,
      expiresAt: result.expiresAt.toISOString(),
      // Present only when no mail provider is configured.
      devCode: result.devCode,
    };
  });
}
