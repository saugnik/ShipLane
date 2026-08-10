"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // The inset highlight gives the filled button a slight lift without a gradient.
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/25 ring-1 ring-inset ring-white/10 " +
    "hover:bg-brand-500 active:bg-brand-700 disabled:bg-brand-600/40 disabled:shadow-none",
  secondary:
    "bg-surface text-ink ring-1 ring-inset ring-line-strong shadow-xs " +
    "hover:bg-sunken active:bg-inset disabled:text-ink-4",
  outline:
    "bg-transparent text-brand-600 ring-1 ring-inset ring-brand-500/35 " +
    "hover:bg-brand-500/8 active:bg-brand-500/14 disabled:text-brand-500/40 dark:text-brand-300",
  ghost:
    "bg-transparent text-ink-2 hover:bg-inset hover:text-ink active:bg-line-soft disabled:text-ink-4",
  danger:
    "bg-rose-600 text-white shadow-sm shadow-rose-600/25 ring-1 ring-inset ring-white/10 " +
    "hover:bg-rose-500 active:bg-rose-700 disabled:bg-rose-600/40",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9.5 px-4 text-[13px] gap-2 rounded-[10px]",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
};

const base =
  "relative inline-flex items-center justify-center font-semibold select-none " +
  "transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.985] " +
  "disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

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

/** Square icon-only button — used in table rows and toolbars. */
export function IconButton({
  label,
  className,
  children,
  tone = "neutral",
  ...rest
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "brand";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const tones = {
    neutral: "text-ink-3 hover:bg-inset hover:text-ink",
    brand: "text-ink-3 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300",
    danger: "text-ink-3 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
  } as const;

  return (
    <button
      type="button"
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
