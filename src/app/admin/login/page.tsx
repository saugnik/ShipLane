import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { currentSession } from "@/lib/auth/session";

/**
 * Reachable only by typing the URL — nothing on the public site links here, and
 * the page is kept out of search indexes.
 */
export const metadata: Metadata = {
  title: "Oversight sign-in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await currentSession();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session) redirect("/dashboard");

  return (
    <AuthShell>
      <AdminLoginForm />
    </AuthShell>
  );
}
