"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/utils";

/**
 * Ops-side scan entry.
 *
 * In production the carrier's webhook writes these; this form exists so the
 * demo (and the ops desk, for manual corrections) can drive a consignment
 * through its lifecycle against the same endpoint.
 */
export function AddScanForm({ lrn, currentStatus }: { lrn: string; currentStatus: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("IN_TRANSIT");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const terminal = currentStatus === "DELIVERED" || currentStatus === "CANCELLED";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${lrn}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, location, remarks }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not record this scan");
        return;
      }
      setOpen(false);
      setLocation("");
      setRemarks("");
      router.refresh();
    } catch {
      setError("Network error — the scan was not recorded.");
    } finally {
      setSaving(false);
    }
  };

  if (terminal) {
    return (
      <p className="text-xs text-ink-3">
        This consignment is closed — no further scans can be added.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Add scan
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3 rounded-lg border border-line bg-sunken p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status" required>
          {({ id }) => (
            <Select id={id} value={status} onChange={(e) => setStatus(e.target.value)}>
              {ORDER_STATUSES.filter((s) => s !== "BOOKED").map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Location" required>
          {({ id }) => (
            <Input
              id={id}
              required
              placeholder="e.g. Nagpur transit hub"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          )}
        </Field>
      </div>

      <Field label="Remarks">
        {({ id }) => (
          <Input
            id={id}
            placeholder="Optional note for the customer-facing trail"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        )}
      </Field>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          Record scan
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
