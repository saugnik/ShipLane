import Link from "next/link";
import { Radar, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";

/**
 * Public chrome. Deliberately shows only "Sign in" and "Create account" — the
 * admin has no self-service entry point and is not advertised anywhere.
 */
export function PublicHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[11px] bg-brand-600 text-white shadow-sm shadow-brand-600/30 ring-1 ring-inset ring-white/15">
            <Truck className="size-4.5" />
          </span>
          <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">{BRAND.name}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-inset hover:text-ink"
          >
            <Radar className="size-3.5" />
            Track a shipment
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
          {signedIn ? (
            <ButtonLink href="/dashboard" size="sm">
              Go to console
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Create account
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
