"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  TriangleAlert,
  User,
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { STRENGTH_LABEL, passwordStrength } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

/**
 * Two-stage registration: the address is checked for deliverability before the
 * form will accept a password. Splitting it this way means a typo is caught at
 * the field that caused it, rather than after the user has filled everything in.
 */
export function RegisterForm() {
  const [stage, setStage] = useState<"email" | "details">("email");

  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (stage === "details") nameRef.current?.focus();
  }, [stage]);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not verify that address");
        // "Did you mean …" comes back inside the message; offer a one-click fix.
        const m = /Did you mean (\S+)\?/.exec(payload.error ?? "");
        if (m) setSuggestion(m[1]);
        return;
      }
      setEmail(payload.data.email);
      setDomain(payload.data.domain);
      setStage("details");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Both passwords must match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company, phone, password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not create your account");
        return;
      }
      // Full navigation so the server picks up the new session cookie.
      window.location.href = "/dashboard";
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-ink">Create your account</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          {stage === "email"
            ? "Start with your work email — we'll check it can receive mail."
            : "Your address checks out. Now set a password."}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5">
          <p className="flex items-start gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
          {suggestion && (
            <button
              type="button"
              onClick={() => {
                setEmail(suggestion);
                setError(null);
                setSuggestion(null);
              }}
              className="mt-1.5 ml-5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              Use {suggestion}
            </button>
          )}
        </div>
      )}

      {stage === "email" ? (
        <form onSubmit={verifyEmail} className="flex flex-col gap-4">
          <Field
            label="Work email"
            required
            hint="We check the domain has a live mail server before continuing."
          >
            {({ id }) => (
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  id={id}
                  required
                  autoFocus
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                />
              </div>
            )}
          </Field>

          <Button type="submit" size="lg" loading={busy} disabled={!email.trim()}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5">
            <p className="flex min-w-0 items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="truncate font-medium">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setError(null);
              }}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-200"
            >
              <ArrowLeft className="size-3" />
              Change
            </button>
          </div>
          <p className="-mt-2 text-[11px] text-ink-4">
            {domain} accepts email. We have not sent anything to it.
          </p>

          <Field label="Your name" required>
            {({ id }) => (
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  ref={nameRef}
                  id={id}
                  required
                  autoComplete="name"
                  className="pl-9"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
          </Field>

          <Field label="Company">
            {({ id }) => (
              <div className="relative">
                <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  id={id}
                  autoComplete="organization"
                  className="pl-9"
                  placeholder="Company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            )}
          </Field>

          <Field label="Mobile number">
            {({ id }) => (
              <Input
                id={id}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            )}
          </Field>

          <Field
            label="Password"
            required
            hint={password ? undefined : "At least 8 characters. Longer beats complicated."}
          >
            {({ id }) => (
              <div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                  <Input
                    id={id}
                    required
                    type={reveal ? "text" : "password"}
                    autoComplete="new-password"
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

                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            i < strength
                              ? strength <= 1
                                ? "bg-rose-500"
                                : strength === 2
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              : "bg-inset",
                          )}
                        />
                      ))}
                    </div>
                    <span className="w-14 shrink-0 text-right text-[11px] font-medium text-ink-3">
                      {STRENGTH_LABEL[strength]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Field>

          <Field label="Confirm password" required error={mismatch ? "Passwords do not match" : undefined}>
            {({ id, invalid }) => (
              <Input
                id={id}
                required
                invalid={invalid}
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            )}
          </Field>

          <Button
            type="submit"
            size="lg"
            loading={busy}
            disabled={!name.trim() || password.length < 8 || mismatch || !confirm}
          >
            Create account
            <ArrowRight className="size-4" />
          </Button>
        </form>
      )}

      <p className="mt-7 border-t border-line pt-5 text-center text-xs text-ink-3">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
