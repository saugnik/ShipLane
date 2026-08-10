import Link from "next/link";
import { Truck } from "lucide-react";
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

      <header className="relative flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[11px] bg-brand-600 text-white shadow-sm shadow-brand-600/30 ring-1 ring-inset ring-white/15">
            <Truck className="size-4.5" />
          </span>
          <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">{BRAND.name}</span>
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
