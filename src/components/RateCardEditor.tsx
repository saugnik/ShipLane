"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { INDIAN_STATES } from "@/lib/india";
import { formatINR } from "@/lib/utils";

type Rate = {
  id: string;
  originState: string;
  originCity: string;
  destState: string;
  destCity: string;
  ratePerKg: number;
  minCharge: number;
  transitDays: number;
  oda: boolean;
};

const blankLane = () => ({
  originState: "*",
  originCity: "",
  destState: "",
  destCity: "",
  ratePerKg: "",
  minCharge: "",
  transitDays: "4",
  oda: false,
});

/**
 * Lane rate card management.
 *
 * "*" means "any" and is what most rows use — carriers publish a state-wide
 * rate and then override the handful of city pairs they have negotiated. The
 * rating engine scores specificity, so adding a city row never requires
 * touching the state row it overrides.
 */
export function RateCardEditor({ partnerId }: { partnerId: string }) {
  const [rates, setRates] = useState<Rate[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankLane);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?destState=${encodeURIComponent(filter)}` : "";
    try {
      const res = await fetch(`/api/partners/${partnerId}/rates${qs}`);
      const payload = await res.json();
      if (res.ok) {
        setRates(payload.data.rates);
        setTotal(payload.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [partnerId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/partners/${partnerId}/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          originCity: form.originCity || "*",
          destCity: form.destCity || "*",
          destState: form.destState || "*",
          ratePerKg: Number(form.ratePerKg),
          minCharge: Number(form.minCharge || 0),
          transitDays: Number(form.transitDays),
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not save this lane");
        return;
      }
      setNotice(payload.data.replaced ? "Existing lane updated" : "Lane added");
      setForm(blankLane());
      await load();
    } catch {
      setError("Network error — the lane was not saved");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rateId: string) => {
    const res = await fetch(`/api/partners/${partnerId}/rates?rateId=${rateId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRates((prev) => prev.filter((r) => r.id !== rateId));
      setTotal((t) => Math.max(0, t - 1));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          icon={Plus}
          title="Add or update a lane"
          description="Leave a field as “Any” to publish a wildcard rate. Saving a lane that already exists overwrites it."
        />
        <CardBody>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Origin state">
                {({ id }) => (
                  <Select
                    id={id}
                    value={form.originState}
                    onChange={(e) => setForm({ ...form, originState: e.target.value })}
                  >
                    <option value="*">Any state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Origin city" hint="Blank = any">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="Any city"
                    value={form.originCity}
                    onChange={(e) => setForm({ ...form, originCity: e.target.value })}
                  />
                )}
              </Field>

              <Field label="Destination state" required>
                {({ id }) => (
                  <Select
                    id={id}
                    required
                    value={form.destState}
                    onChange={(e) => setForm({ ...form, destState: e.target.value })}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Destination city" hint="Blank = any">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="Any city"
                    value={form.destCity}
                    onChange={(e) => setForm({ ...form, destCity: e.target.value })}
                  />
                )}
              </Field>

              <Field label="Rate per kg (₹)" required>
                {({ id }) => (
                  <Input
                    id={id}
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="tnum"
                    value={form.ratePerKg}
                    onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })}
                  />
                )}
              </Field>

              <Field label="Minimum charge (₹)">
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    min="0"
                    step="0.01"
                    className="tnum"
                    value={form.minCharge}
                    onChange={(e) => setForm({ ...form, minCharge: e.target.value })}
                  />
                )}
              </Field>

              <Field label="Transit days" required>
                {({ id }) => (
                  <Input
                    id={id}
                    required
                    type="number"
                    min="1"
                    max="30"
                    className="tnum"
                    value={form.transitDays}
                    onChange={(e) => setForm({ ...form, transitDays: e.target.value })}
                  />
                )}
              </Field>

              <div className="flex items-end pb-2.5">
                <Checkbox
                  checked={form.oda}
                  onChange={(v) => setForm({ ...form, oda: v })}
                  label="Out of delivery area"
                  hint="Adds the carrier's ODA charge"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                <TriangleAlert className="size-3.5" />
                {error}
              </p>
            )}
            {notice && <p className="text-xs font-medium text-emerald-600">{notice}</p>}

            <div>
              <Button type="submit" loading={saving}>
                Save lane
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Published lanes"
          description={`${total} lane${total === 1 ? "" : "s"}${filter ? ` into ${filter}` : ""}`}
          action={
            <div className="w-56">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All destination states</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading rate card…
            </div>
          ) : rates.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              No lanes published for this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="[&>th]:label-caps [&>th]:px-5 [&>th]:py-2.5">
                    <th>Origin</th>
                    <th>Destination</th>
                    <th className="text-right">₹ / kg</th>
                    <th className="text-right">Min charge</th>
                    <th className="text-right">Transit</th>
                    <th>Flags</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-2.5 text-slate-700">
                        <Lane state={rate.originState} city={rate.originCity} />
                      </td>
                      <td className="px-5 py-2.5 text-slate-700">
                        <Lane state={rate.destState} city={rate.destCity} />
                      </td>
                      <td className="tnum px-5 py-2.5 text-right font-semibold text-slate-900">
                        {formatINR(rate.ratePerKg)}
                      </td>
                      <td className="tnum px-5 py-2.5 text-right text-slate-700">
                        {formatINR(rate.minCharge)}
                      </td>
                      <td className="tnum px-5 py-2.5 text-right text-slate-700">
                        {rate.transitDays}d
                      </td>
                      <td className="px-5 py-2.5">
                        {rate.oda ? <Badge tone="warning">ODA</Badge> : null}
                        {rate.destCity !== "*" && <Badge tone="brand">City lane</Badge>}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => void remove(rate.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete lane"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete lane</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Lane({ state, city }: { state: string; city: string }) {
  return (
    <span>
      <span className="font-medium">{city === "*" ? "Any city" : city}</span>
      <span className="block text-[11px] text-slate-500">
        {state === "*" ? "Any state" : state}
      </span>
    </span>
  );
}
