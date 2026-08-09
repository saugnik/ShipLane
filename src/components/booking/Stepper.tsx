"use client";

import { Check } from "lucide-react";
import { STEPS, type StepId } from "@/lib/bookingState";
import { cn } from "@/lib/utils";

export function Stepper({
  current,
  onJump,
  reachable,
}: {
  current: StepId;
  onJump: (step: StepId) => void;
  reachable: (step: StepId) => boolean;
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Booking progress" className="no-print">
      <ol className="flex items-stretch overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const open = reachable(step.id);

          return (
            <li key={step.id} className="flex min-w-0 flex-1">
              <button
                type="button"
                disabled={!open && !active}
                onClick={() => onJump(step.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3 text-left transition-colors sm:px-4",
                  active && "bg-brand-50/60",
                  !active && open && "hover:bg-slate-50",
                  !open && !active && "cursor-not-allowed opacity-55",
                  i > 0 && "border-l border-slate-200",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
                    done && "bg-emerald-500 text-white",
                    active && "bg-brand-600 text-white",
                    !done && !active && "bg-slate-100 text-slate-500",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-xs font-semibold",
                      active ? "text-brand-800" : done ? "text-slate-800" : "text-slate-500",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="hidden truncate text-[11px] text-slate-400 sm:block">
                    {step.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
