import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpForm } from "@/components/auth/OtpForm";
import { currentSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await currentSession()) redirect("/dashboard");
  const { next } = await searchParams;

  return (
    <AuthShell>
      <Suspense>
        {/* Only relative paths — an absolute `next` would be an open redirect. */}
        <OtpForm purpose="LOGIN" next={next?.startsWith("/") ? next : undefined} />
      </Suspense>
    </AuthShell>
  );
}
