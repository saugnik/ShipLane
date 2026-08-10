import { handle } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  return handle(async () => {
    await clearSessionCookie();
    return { signedOut: true };
  });
}
