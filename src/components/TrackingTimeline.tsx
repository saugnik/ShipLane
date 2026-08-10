import { Check, CircleDot, MapPin } from "lucide-react";
import { STATUS_LABEL, TRACKING_JOURNEY, cn, formatDateTime } from "@/lib/utils";

export type TrackingEventView = {
  status: string;
  location: string;
  remarks?: string | null;
  createdAt: string | Date;
};

/**
 * Two views of the same trail: a horizontal progress rail showing where the
 * consignment is in the standard journey, and the raw scan log beneath it.
 * Exceptions deliberately do not appear on the rail — they are not a stage,
 * they are a deviation, and collapsing them into the rail hides that.
 */
export function TrackingTimeline({
  status,
  events,
}: {
  status: string;
  events: TrackingEventView[];
}) {
  const reachedIndex = TRACKING_JOURNEY.indexOf(status as (typeof TRACKING_JOURNEY)[number]);
  const derailed = status === "EXCEPTION" || status === "CANCELLED";

  return (
    <div className="flex flex-col gap-6">
      {!derailed && (
        <ol className="flex overflow-x-auto pb-1">
          {TRACKING_JOURNEY.map((stage, i) => {
            const done = i <= reachedIndex;
            const current = i === reachedIndex;
            return (
              <li key={stage} className="flex min-w-28 flex-1 flex-col gap-2">
                <div className="flex items-center">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full ring-4 transition-colors",
                      current
                        ? "bg-brand-600 text-white ring-brand-500/20"
                        : done
                          ? "bg-emerald-500 text-white ring-emerald-500/20"
                          : "bg-line-soft text-ink-4 ring-line-soft",
                    )}
                  >
                    {current ? (
                      <CircleDot className="size-3.5" />
                    ) : done ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : null}
                  </span>
                  {i < TRACKING_JOURNEY.length - 1 && (
                    <span
                      className={cn(
                        "h-0.5 flex-1",
                        i < reachedIndex ? "bg-emerald-400" : "bg-line-soft",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "pr-3 text-[11px] leading-tight font-semibold",
                    current ? "text-brand-600 dark:text-brand-300" : done ? "text-ink-2" : "text-ink-4",
                  )}
                >
                  {STATUS_LABEL[stage]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {derailed && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          This consignment is marked <span className="font-semibold">{STATUS_LABEL[status]}</span>.
          See the scan log below for the reason.
        </div>
      )}

      <ol className="relative flex flex-col gap-5 border-l border-line pl-5">
        {events.map((event, i) => (
          <li key={`${event.status}-${i}`} className="relative">
            <span
              className={cn(
                "absolute top-1 -left-[26px] size-2.5 rounded-full ring-4 ring-white",
                i === 0 ? "bg-brand-600" : "bg-line-strong",
              )}
            />
            <p className="text-sm font-semibold text-ink">
              {STATUS_LABEL[event.status] ?? event.status}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {event.location}
              </span>
              <span aria-hidden>·</span>
              <span>{formatDateTime(event.createdAt)}</span>
            </p>
            {event.remarks && <p className="mt-1 text-xs text-ink-2">{event.remarks}</p>}
          </li>
        ))}
        {events.length === 0 && <li className="text-sm text-ink-3">No scans recorded yet.</li>}
      </ol>
    </div>
  );
}
