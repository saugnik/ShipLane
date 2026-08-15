"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE_NAV, type NavItem } from "@/lib/siteNav";
import { cn } from "@/lib/utils";

/**
 * Tabbed public navigation.
 *
 * The active tab carries an orange underline rather than a colour change — on a
 * row of eight items a weight or hue shift is easy to miss, whereas a rule under
 * one tab is unmistakable at a glance.
 */
export function SiteNav({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // A route change should never leave a dropdown or the drawer hanging open.
  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const isActive = (item: NavItem) => {
    if (item.href === "/") return pathname === "/";
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
    // A dropdown tab stays lit while you are on any of its children.
    return Boolean(item.children?.some((c) => pathname === c.href.split("#")[0]));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/92 backdrop-blur-[10px]">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Logo />
        </Link>

        {/* ---------------------------------------------------- desktop tabs */}
        <nav ref={navRef} className="ml-auto hidden h-full items-stretch xl:flex">
          {SITE_NAV.map((item) => {
            const active = isActive(item);
            const hasMenu = Boolean(item.children?.length);

            return (
              <div
                key={item.label}
                className="relative flex items-stretch"
                onMouseEnter={() => hasMenu && setOpen(item.label)}
                onMouseLeave={() => hasMenu && setOpen(null)}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-expanded={hasMenu ? open === item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-1 px-4 text-[14.5px] font-medium transition-colors",
                    active ? "text-ink" : "text-ink-2 hover:text-brand-600 dark:hover:text-brand-400",
                  )}
                >
                  {item.label}
                  {hasMenu && (
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform",
                        open === item.label && "rotate-180",
                      )}
                    />
                  )}
                  {/* The signature underline. */}
                  <span
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand-500 transition-transform duration-200",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                    aria-hidden
                  />
                </Link>

                {hasMenu && open === item.label && (
                  <div className="animate-in-up absolute top-full left-1/2 w-64 -translate-x-1/2 pt-1">
                    <ul className="overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-lg">
                      {item.children!.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-4 py-2.5 transition-colors hover:bg-inset"
                          >
                            <span className="block text-[13.5px] font-semibold text-ink">
                              {child.label}
                            </span>
                            {child.blurb && (
                              <span className="mt-0.5 block text-[12px] text-ink-3">
                                {child.blurb}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          <ThemeToggle />
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
          {signedIn ? (
            <ButtonLink href="/dashboard" variant="navy" size="sm">
              Console
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" size="sm" className="hidden sm:inline-flex">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" variant="navy" size="sm">
                Ship now
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-ink-2 hover:bg-inset xl:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-surface shadow-lg">
            <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-line px-5">
              <Logo size={34} />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-ink-3 hover:bg-inset"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              {SITE_NAV.map((item) => (
                <div key={item.label} className="border-b border-line-soft py-1 last:border-0">
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors",
                      isActive(item)
                        ? "bg-brand-500/12 text-brand-700 dark:text-brand-400"
                        : "text-ink hover:bg-inset",
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-lg py-2 pl-6 text-[13.5px] text-ink-2 transition-colors hover:bg-inset hover:text-ink"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            <div className="shrink-0 border-t border-line p-4">
              {signedIn ? (
                <ButtonLink href="/dashboard" className="w-full">
                  Open console
                </ButtonLink>
              ) : (
                <div className="flex gap-2">
                  <ButtonLink href="/login" variant="secondary" className="flex-1">
                    Sign in
                  </ButtonLink>
                  <ButtonLink href="/register" className="flex-1">
                    Ship now
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
