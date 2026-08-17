import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { checkEmail } from "@/lib/auth/email";
import { deliverOtp, otpIsEchoed } from "@/lib/auth/mailer";
import { CODE_TTL_MINUTES, issueOtp } from "@/lib/auth/otp";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().min(1, "Enter your email address") });

/**
 * Step two of registration: send a code to prove the address is actually read
 * by the person signing up.
 *
 * Delivery failure is reported as a failure. Answering "sent" when nothing left
 * the building leaves someone staring at an inbox forever.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const { email: raw } = schema.parse(await req.json());

    const result = await checkEmail(raw);
    if (!result.ok) throw new HttpError(result.error, 422);

    const existing = await prisma.account.findUnique({
      where: { email: result.email },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError("An account with that email already exists. Sign in instead.", 409);
    }

    const issued = await issueOtp(result.email, "REGISTER");
    if (!issued.ok) throw new HttpError(issued.error, 429);

    const delivery = await deliverOtp(result.email, issued.code, "REGISTER");
    if (!delivery.ok) throw new HttpError(delivery.reason, 502);

    const echoed = otpIsEchoed();
    return {
      email: result.email,
      expiresInMinutes: CODE_TTL_MINUTES,
      // Only ever populated when no mail provider is configured, and the UI
      // shows a warning banner whenever it is.
      echoed,
      ...(echoed ? { code: issued.code } : {}),
    };
  });
}
