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
  const progress = (currentIndex / (STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Booking progress" className="no-print">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
        {/* Continuous progress rail behind the steps. */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-inset">
          <div
            className="h-full bg-brand-600 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="flex items-stretch overflow-x-auto">
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
                    "group flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3.5 text-left transition-colors sm:px-4",
                    active && "bg-brand-500/6",
                    !active && open && "hover:bg-sunken",
                    !open && !active && "cursor-not-allowed opacity-45",
                    i > 0 && "border-l border-line",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6.5 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-all duration-200",
                      done && "bg-emerald-500 text-white",
                      active &&
                        "bg-brand-600 text-white ring-4 ring-brand-500/20",
                      !done && !active && "bg-inset text-ink-4 ring-1 ring-inset ring-line",
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-xs font-semibold transition-colors",
                        active
                          ? "text-brand-700 dark:text-brand-300"
                          : done
                            ? "text-ink"
                            : "text-ink-3",
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="hidden truncate text-[11px] text-ink-4 sm:block">
                      {step.hint}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
