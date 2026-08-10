import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpForm } from "@/components/auth/OtpForm";
import { currentSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await currentSession()) redirect("/dashboard");

  return (
    <AuthShell>
      <Suspense>
        <OtpForm purpose="REGISTER" />
      </Suspense>
    </AuthShell>
  );
}
