"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, TriangleAlert } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Those credentials are not valid");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <p className="label-caps">Restricted</p>
        <h1 className="mt-1.5 text-[22px] font-bold tracking-[-0.025em] text-ink">
          Oversight sign-in
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          Read-only access to every account&apos;s consignments.
        </p>
      </div>

      {error && (
        <p className="mb-4 flex items-start gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email" required>
          {({ id }) => (
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
              <Input
                id={id}
                required
                type="email"
                autoComplete="username"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
        </Field>

        <Field label="Password" required>
          {({ id }) => (
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
              <Input
                id={id}
                required
                type={reveal ? "text" : "password"}
                autoComplete="current-password"
                className="pr-11 pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute top-1/2 right-1 -translate-y-1/2">
                <IconButton
                  label={reveal ? "Hide password" : "Show password"}
                  onClick={() => setReveal((v) => !v)}
                >
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </IconButton>
              </div>
            </div>
          )}
        </Field>

        <Button type="submit" size="lg" loading={busy} disabled={!email.trim() || !password}>
          Sign in
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  );
}
