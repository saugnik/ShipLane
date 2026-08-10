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
