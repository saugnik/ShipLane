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
  "w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 " +
  "transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:bg-slate-50 " +
  "disabled:text-slate-400";

const okBorder = "border-slate-300 focus:border-brand-500";
const errBorder = "border-rose-400 focus:border-rose-500 focus:ring-rose-500/25";

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
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>

      {children({ id, invalid: Boolean(error), describedBy })}

      {error ? (
        <p id={`${id}-err`} className="flex items-start gap-1 text-xs font-medium text-rose-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      className={cn(controlClass, "h-10", invalid ? errBorder : okBorder, className)}
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
        "h-10 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9",
        invalid ? errBorder : okBorder,
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
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
      className={cn(controlClass, "py-2 leading-relaxed", invalid ? errBorder : okBorder, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

/** Segmented control — better than a select for 2-4 mutually exclusive options. */
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
      className={cn("inline-flex w-full rounded-lg bg-slate-100 p-0.5", className)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          title={opt.hint}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-[7px] px-3 py-1.5 text-xs font-semibold transition-colors",
            value === opt.value
              ? "bg-white text-slate-900 shadow-card"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {opt.label}
        </button>
      ))}
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
        className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
      />
      <label htmlFor={id} className="text-sm leading-tight text-slate-700">
        <span className="font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </label>
    </div>
  );
}
