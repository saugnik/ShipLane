"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-card hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary:
    "bg-white text-slate-800 ring-1 ring-slate-200 shadow-card hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400",
  outline:
    "bg-transparent text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50 active:bg-brand-100 disabled:text-brand-300",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300",
  danger: "bg-rose-600 text-white shadow-card hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-sm gap-2 rounded-xl",
};

const base =
  "inline-flex items-center justify-center font-semibold transition-colors select-none " +
  "disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={cn(base, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </Link>
  );
}
