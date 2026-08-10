"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldAlert, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type Purpose = "LOGIN" | "REGISTER";

/**
 * Two-stage OTP form: collect details, then verify the code.
 *
 * Kept as one component because the email typed in stage one is what stage two
 * verifies against — splitting them across routes would mean putting the
 * address in the URL.
 */
export function OtpForm({ purpose, next }: { purpose: Purpose; next?: string }) {
  const isRegister = purpose === "REGISTER";

  const [stage, setStage] = useState<"details" | "code">("details");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage === "code") codeRef.current?.focus();
  }, [stage]);

  // Resend throttle mirrors the server's own limit.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const request = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose, name, company, phone }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not send the code");
        return;
      }
      setDevCode(payload.data?.devCode ?? null);
      setStage("code");
      setCooldown(45);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose, code }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "That code is not valid");
        setCode("");
        codeRef.current?.focus();
        return;
      }
      // Full navigation so the server re-reads the new session cookie.
      window.location.href = next || "/dashboard";
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-ink">
          {stage === "code"
            ? "Enter your code"
            : isRegister
              ? "Create your account"
              : "Sign in"}
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          {stage === "code" ? (
            <>
              We sent a 6-digit code to <span className="font-medium text-ink-2">{email}</span>. It
              expires in 10 minutes.
            </>
          ) : isRegister ? (
            "No password needed — we'll email you a one-time code."
          ) : (
            "Enter your email and we'll send a one-time code."
          )}
        </p>
      </div>

      {devCode && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
          <ShieldAlert className="mt-px size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Demo mode — no email provider configured</p>
            <p className="mt-0.5">
              Your code is{" "}
              <span className="docnum text-sm font-bold tracking-widest">{devCode}</span>. Anyone
              who can reach this page can sign in. Set <code>RESEND_API_KEY</code> to send real
              email, or <code>OTP_ECHO=off</code> to disable this.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 flex items-start gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}

      {stage === "details" ? (
        <form onSubmit={request} className="flex flex-col gap-4">
          {isRegister && (
            <>
              <Field label="Your name" required>
                {({ id }) => (
                  <Input
                    id={id}
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Company">
                {({ id }) => (
                  <Input
                    id={id}
                    autoComplete="organization"
                    placeholder="Company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
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
            </>
          )}

          <Field label="Work email" required>
            {({ id }) => (
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  id={id}
                  required
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
          </Field>

          <Button type="submit" size="lg" loading={busy} disabled={!email.trim()}>
            Send code
            <ArrowRight className="size-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-4">
          <Field label="6-digit code" required>
            {({ id }) => (
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  ref={codeRef}
                  id={id}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className={cn("docnum pl-9 text-center text-lg tracking-[0.5em]")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            )}
          </Field>

          <Button type="submit" size="lg" loading={busy} disabled={code.length !== 6}>
            {isRegister ? "Create account" : "Sign in"}
            <ArrowRight className="size-4" />
          </Button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStage("details");
                setCode("");
                setError(null);
                setDevCode(null);
              }}
              className="inline-flex items-center gap-1 font-semibold text-ink-3 hover:text-ink"
            >
              <ArrowLeft className="size-3" />
              Change email
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void request()}
              className="font-semibold text-brand-600 hover:underline disabled:text-ink-4 disabled:no-underline dark:text-brand-300"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <p className="mt-7 border-t border-line pt-5 text-center text-xs text-ink-3">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
