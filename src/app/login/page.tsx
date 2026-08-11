import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
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
        <LoginForm next={next?.startsWith("/") ? next : undefined} />
      </Suspense>
    </AuthShell>
  );
}
