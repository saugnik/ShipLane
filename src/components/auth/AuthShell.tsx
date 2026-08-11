import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";

/** Centred card layout shared by sign-in, registration and admin sign-in. */
export function AuthShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas">
      <div className="grid-paper pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -top-52 left-1/2 size-[620px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-brand-500), transparent 65%)" }}
        aria-hidden
      />

      <header className="relative flex h-[76px] items-center px-5 sm:px-8">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-lg sm:p-8">
            {children}
          </div>
          {aside}
        </div>
      </main>

      <footer className="relative px-4 py-6 text-center text-[11px] text-ink-4 sm:px-6">
        {BRAND.legalName}
      </footer>
    </div>
  );
}
