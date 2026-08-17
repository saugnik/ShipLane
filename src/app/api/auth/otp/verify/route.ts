import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { checkEmail } from "@/lib/auth/email";
import { verifyOtp } from "@/lib/auth/otp";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/**
 * Exchanges a correct code for a short-lived verification token.
 *
 * The token is what registration accepts — not the code itself — so the code
 * cannot be replayed, and a token is only good for an account on the address it
 * was issued against.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const input = schema.parse(await req.json());

    const email = await checkEmail(input.email);
    if (!email.ok) throw new HttpError(email.error, 422);

    const result = await verifyOtp(email.email, input.code, "REGISTER");
    if (!result.ok) throw new HttpError(result.error, 422);

    return { email: email.email, verificationToken: result.token };
  });
}
