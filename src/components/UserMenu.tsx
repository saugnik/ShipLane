"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/session";

export function UserMenu({ name, email, role }: { name: string; email: string; role: Role }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const signOut = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Full navigation so the server drops the cleared cookie.
    window.location.href = "/";
  };

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-inset"
      >
        <span className="grid size-7 place-items-center rounded-md bg-brand-600 text-[11px] font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate text-[13px] font-medium text-ink sm:block">
          {name}
        </span>
        <ChevronDown className={cn("size-3.5 text-ink-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-in-up absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-3">{email}</p>
            <div className="mt-2">
              {role === "ADMIN" ? (
                <Badge tone="warning">
                  <Eye className="size-3" /> Oversight · read-only
                </Badge>
              ) : (
                <Badge tone="brand">
                  <ShieldCheck className="size-3" /> Booking account
                </Badge>
              )}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] font-medium text-ink-2 transition-colors hover:bg-inset hover:text-ink disabled:opacity-50"
          >
            <LogOut className="size-4 text-ink-4" />
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
