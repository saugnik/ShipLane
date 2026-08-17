"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ShieldCheck,
  TriangleAlert,
  User,
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { STRENGTH_LABEL, passwordStrength } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

/**
 * Three-stage registration: address → emailed code → details.
 *
 * Splitting it this way means a typo is caught at the field that caused it, and
 * the account is only ever created for an address the person can actually read.
 * Each stage carries forward exactly one thing — the verified address, then the
 * verification token — so going back never leaves stale state behind.
 */
type Stage = "email" | "code" | "details";

export function RegisterForm() {
  const [stage, setStage] = useState<Stage>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [echoedCode, setEchoedCode] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage === "code") codeRef.current?.focus();
    if (stage === "details") nameRef.current?.focus();
  }, [stage]);

  // Resend countdown, so the button says how long rather than just refusing.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  const sendCode = useCallback(
    async (address: string) => {
      setBusy(true);
      setError(null);
      setSuggestion(null);
      try {
        const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: address }),
        });
        const payload = await res.json();
        if (!res.ok) {
          setError(payload.error ?? "Could not send a code to that address");
          const m = /Did you mean (\S+)\?/.exec(payload.error ?? "");
          if (m) setSuggestion(m[1]);
          return false;
        }
        setEmail(payload.data.email);
        setEchoedCode(payload.data.echoed ? (payload.data.code ?? null) : null);
        setNotice(`Code sent to ${payload.data.email}. It expires in ${payload.data.expiresInMinutes} minutes.`);
        setCooldown(30);
        setStage("code");
        return true;
      } catch {
        setError("Network error — please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "That code did not work");
        return;
      }
      setToken(payload.data.verificationToken);
      setNotice(null);
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
        body: JSON.stringify({ email, name, company, phone, password, verificationToken: token }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not create your account");
        // An expired verification means starting the code step again.
        if (res.status === 403) {
          setToken("");
          setCode("");
          setStage("code");
        }
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

  const subtitle =
    stage === "email"
      ? "Any email you can receive mail at — personal or work."
      : stage === "code"
        ? "We sent you a 6-digit code. Enter it to confirm the address is yours."
        : "Address confirmed. Now set a password.";

  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-ink">Create your account</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{subtitle}</p>
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

      {notice && !error && stage === "code" && (
        <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5">
          <p className="flex items-start gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="mt-px size-3.5 shrink-0" />
            {notice}
          </p>
        </div>
      )}

      {/* Loud on purpose: with no mail provider configured the code is shown in
          the browser, which means anyone who can reach this page can register
          any address. Fine for a demo, never for production. */}
      {echoedCode && stage === "code" && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/12 px-3.5 py-3">
          <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            Demo mode — no mail provider configured
          </p>
          <p className="mt-1 ml-5 text-xs text-amber-900/90 dark:text-amber-200/90">
            Your code is <span className="docnum font-bold">{echoedCode}</span>. Set
            MAILJET_API_KEY and MAILJET_SECRET_KEY to send it by email instead.
          </p>
        </div>
      )}

      {stage === "email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode(email);
          }}
          className="flex flex-col gap-4"
        >
          <Field
            label="Email address"
            required
            hint="Gmail, Outlook, Yahoo or your own domain — all work."
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
                  placeholder="you@gmail.com"
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
            Send verification code
            <ArrowRight className="size-4" />
          </Button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-sunken px-3.5 py-2.5">
            <p className="flex min-w-0 items-center gap-2 text-xs text-ink-2">
              <Mail className="size-4 shrink-0 text-ink-4" />
              <span className="truncate font-medium">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setCode("");
                setError(null);
                setNotice(null);
                setEchoedCode(null);
              }}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              <ArrowLeft className="size-3" />
              Change
            </button>
          </div>

          <Field label="Verification code" required>
            {({ id }) => (
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  ref={codeRef}
                  id={id}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="docnum pl-9 text-center text-[20px] tracking-[0.5em]"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                />
              </div>
            )}
          </Field>

          <Button type="submit" size="lg" loading={busy} disabled={code.length !== 6}>
            Verify email
            <ArrowRight className="size-4" />
          </Button>

          <button
            type="button"
            disabled={busy || cooldown > 0}
            onClick={() => void sendCode(email)}
            className="text-center text-xs font-medium text-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:text-ink-4"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Did not get it? Resend code"}
          </button>
        </form>
      )}

      {stage === "details" && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <p className="min-w-0 text-xs text-emerald-800 dark:text-emerald-200">
              <span className="truncate font-medium">{email}</span> verified
            </p>
          </div>

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

          <Field label="Company" hint="Optional — leave blank if you are shipping as an individual.">
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

          <Field
            label="Confirm password"
            required
            error={mismatch ? "Passwords do not match" : undefined}
          >
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
