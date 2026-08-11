"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  Eye,
  Headset,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Radar,
  Truck,
  X,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import type { Role } from "@/lib/auth/session";

/**
 * Navigation is role-derived rather than filtered at render: an ADMIN never
 * sees "Book shipment" because booking is not something the role can do, and a
 * USER never learns that an oversight console exists.
 */
function navFor(role: Role) {
  if (role === "ADMIN") {
    return [
      {
        section: "Oversight",
        items: [
          { href: "/admin", label: "All activity", icon: Eye, exact: true },
          { href: "/orders", label: "Consignments", icon: Boxes },
        ],
      },
      {
        section: "Network",
        items: [
          { href: "/partners", label: "Carriers & rates", icon: Truck },
          { href: "/track", label: "Track", icon: Radar },
        ],
      },
    ];
  }

  return [
    {
      section: "Operate",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/book", label: "Book shipment", icon: PackagePlus },
        { href: "/orders", label: "Consignments", icon: Boxes },
      ],
    },
    {
      section: "Network",
      items: [
        { href: "/partners", label: "Carriers & rates", icon: Truck },
        { href: "/track", label: "Track", icon: Radar },
      ],
    },
  ];
}

export function AppShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const NAV = navFor(viewer.role);
  const isAdmin = viewer.role === "ADMIN";

  // Close the slide-over on navigation, otherwise it covers the page you just
  // asked for on mobile.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[254px_1fr]">
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface",
          "transition-transform duration-200 lg:static lg:w-auto lg:translate-x-0",
          open ? "translate-x-0 shadow-lg" : "-translate-x-full",
        )}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-line px-5">
          <Link href={isAdmin ? "/admin" : "/dashboard"} aria-label="Home">
            <Logo size={36} sub={isAdmin ? "Oversight" : "Freight console"} />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-ink-3 hover:bg-inset hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {NAV.map((group) => (
            <div key={group.section} className="mb-5 last:mb-0">
              <p className="label-caps mb-1.5 px-3 text-[10px]">{group.section}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, icon: Icon, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-brand-500/12 text-brand-700 dark:text-brand-400"
                          : "text-ink-2 hover:bg-inset hover:text-ink",
                      )}
                    >
                      {/* Accent rail marks the active route without a heavy fill. */}
                      <span
                        className={cn(
                          "absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500 transition-transform duration-200",
                          active ? "scale-y-100" : "scale-y-0",
                        )}
                        aria-hidden
                      />
                      <Icon
                        className={cn(
                          "size-4 transition-colors",
                          active ? "text-brand-500" : "text-ink-4 group-hover:text-ink-2",
                        )}
                      />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-3">
          <div className="rounded-xl border border-line bg-sunken p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Headset className="size-3.5 text-ink-3" />
              Ops desk
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
              {BRAND.supportPhone}
              <br />
              <span className="break-all">{BRAND.supportEmail}</span>
            </p>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="animate-in-fade fixed inset-0 z-40 backdrop-blur-[2px] lg:hidden"
          style={{ backgroundColor: "var(--overlay)" }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-[10px] sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-ink-2 hover:bg-inset lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          {isAdmin && (
            <span className="hidden items-center gap-1.5 rounded-md bg-amber-500/12 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/25 sm:inline-flex dark:text-amber-400">
              <Eye className="size-3" />
              Read-only
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
            <ButtonLink href="/track" variant="secondary" size="sm">
              <Radar className="size-3.5" />
              <span className="hidden sm:inline">Track</span>
            </ButtonLink>
            {!isAdmin && (
              <ButtonLink href="/book" variant="navy" size="sm">
                <PackagePlus className="size-3.5" />
                <span className="hidden sm:inline">Ship now</span>
              </ButtonLink>
            )}
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
            <UserMenu name={viewer.name} email={viewer.email} role={viewer.role} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

/** Page title block used at the top of each route. */
export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="text-[26px] leading-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-3">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
