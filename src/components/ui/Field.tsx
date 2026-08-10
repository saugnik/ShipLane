"use client";

import { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form primitives.
 *
 * A booking form fails on the small things — a missing asterisk, an error that
 * appears somewhere other than the field it belongs to. So label, control,
 * hint and error are one component and the error always wins the hint slot.
 */

export const controlClass =
  "w-full rounded-[var(--radius-control)] bg-surface px-3 text-[13px] text-ink " +
  "placeholder:text-ink-4 ring-1 ring-inset transition-[box-shadow,background-color] duration-150 " +
  "focus:outline-none disabled:bg-inset disabled:text-ink-4 disabled:cursor-not-allowed";

const okRing = "ring-line-strong hover:ring-ink-4/50 focus:ring-2 focus:ring-brand-500";
const errRing = "ring-rose-500/60 focus:ring-2 focus:ring-rose-500";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => React.ReactNode;
};

export function Field({ label, required, error, hint, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>

      {children({ id, invalid: Boolean(error), describedBy })}

      {error ? (
        <p
          id={`${id}-err`}
          className="animate-in-fade flex items-start gap-1 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// React 19 passes `ref` as an ordinary prop, so no forwardRef wrapper is needed
// — it just has to be declared on the type to survive the spread.
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  ref?: React.Ref<HTMLInputElement>;
};

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      className={cn(controlClass, "h-9.5", invalid ? errRing : okRing, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        controlClass,
        "h-9.5 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9",
        invalid ? errRing : okRing,
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2399a1b3'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(controlClass, "py-2 leading-relaxed", invalid ? errRing : okRing, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

/**
 * Segmented control — better than a select for 2-4 mutually exclusive options,
 * because every choice stays visible and is one click away.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex w-full rounded-[var(--radius-control)] bg-inset p-0.5 ring-1 ring-inset ring-line-soft",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-[7px] px-3 py-1.5 text-xs font-semibold transition-all duration-150",
              active
                ? "bg-surface text-ink shadow-xs ring-1 ring-line"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-line-strong bg-surface text-brand-600 focus:ring-brand-500/40"
      />
      <label htmlFor={id} className="text-[13px] leading-tight text-ink-2">
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="mt-1 block text-xs leading-relaxed text-ink-3">{hint}</span>}
      </label>
    </div>
  );
}
