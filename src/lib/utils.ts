import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const formatINR = (n: number) => inr.format(n ?? 0);

/** Compact form for dense tables — ₹1.2L, ₹45.0K. */
export function formatINRCompact(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return formatINR(n);
}

export const formatKg = (n: number) => `${(n ?? 0).toFixed(2)} kg`;

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export const ORDER_STATUSES = [
  "BOOKED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "REACHED_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Booked",
  PICKUP_SCHEDULED: "Pickup scheduled",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  REACHED_DESTINATION_HUB: "At destination hub",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
  CANCELLED: "Cancelled",
};

/** Tailwind classes per status — kept as full literals so JIT can see them. */
export const STATUS_TONE: Record<string, string> = {
  BOOKED: "bg-slate-100 text-slate-700 ring-slate-200",
  PICKUP_SCHEDULED: "bg-sky-50 text-sky-700 ring-sky-200",
  PICKED_UP: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  IN_TRANSIT: "bg-amber-50 text-amber-700 ring-amber-200",
  REACHED_DESTINATION_HUB: "bg-violet-50 text-violet-700 ring-violet-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 ring-orange-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXCEPTION: "bg-rose-50 text-rose-700 ring-rose-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

/** The happy path, in order — drives the tracking stepper. */
export const TRACKING_JOURNEY: OrderStatus[] = [
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "REACHED_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const MOT_LABEL: Record<string, string> = {
  ROAD: "Road",
  AIR: "Air",
  RAIL: "Rail",
};

export const PAYMENT_LABEL: Record<string, string> = {
  BTC: "BTC (Bill to Client)",
  PAID: "Paid",
  TO_PAY: "To Pay",
  PREPAID: "Pre-paid",
  COD: "COD",
};

export const PICKUP_TYPE_LABEL: Record<string, string> = {
  SELF_DROP: "Self drop",
  SCHEDULED_PICKUP: "Scheduled pickup",
};

export const DELIVERY_TYPE_LABEL: Record<string, string> = {
  SELF_COLLECT: "Self collect",
  DOOR_DELIVERY: "Door delivery",
};

export const RISK_LABEL: Record<string, string> = {
  OWNER: "Owner risk",
  CARRIER: "Carrier risk",
};
