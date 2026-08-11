import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { checkEmail } from "@/lib/auth/email";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().min(1, "Enter your email address") });

/**
 * Gate for step one of registration: is this a real, deliverable address that
 * is not already taken? Only after this passes does the form ask for a password.
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

    return { email: result.email, domain: result.domain };
  });
}
