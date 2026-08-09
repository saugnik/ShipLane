"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Radar,
  Truck,
  X,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/book", label: "Book shipment", icon: PackagePlus },
  { href: "/orders", label: "Consignments", icon: Boxes },
  { href: "/partners", label: "Carriers & rates", icon: Truck },
  { href: "/track", label: "Track", icon: Radar },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar — persistent on desktop, slide-over on mobile */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform lg:static lg:w-auto lg:translate-x-0",
          open ? "translate-x-0 shadow-pop" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Truck className="size-4.5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-slate-900">
                {BRAND.name}
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                Freight console
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className={cn("size-4", active ? "text-brand-600" : "text-slate-400")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">Need a hand?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Ops desk {BRAND.supportPhone}
            <br />
            {BRAND.supportEmail}
          </p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href="/track" variant="secondary" size="sm">
              <Radar className="size-4" />
              Track a consignment
            </ButtonLink>
            <ButtonLink href="/book" size="sm">
              <PackagePlus className="size-4" />
              New booking
            </ButtonLink>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/** Page title block used at the top of each route. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
