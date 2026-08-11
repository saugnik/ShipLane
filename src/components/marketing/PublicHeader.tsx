import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/track", label: "Track" },
  { href: "/#services", label: "Services" },
  { href: "/#how", label: "How it works" },
  { href: "/#rates", label: "Rates" },
];

/**
 * Public chrome. Deliberately shows only "Sign in" and "Create account" — the
 * admin has no self-service entry point and is not advertised anywhere.
 */
export function PublicHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/88 backdrop-blur-[10px]">
      <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[14.5px] font-medium text-ink-2 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
          {signedIn ? (
            <ButtonLink href="/dashboard" variant="navy" size="sm">
              Go to console
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" variant="navy" size="sm">
                Ship now
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
