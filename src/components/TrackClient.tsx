"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Boxes, CalendarClock, PackageSearch, Radar, Truck } from "lucide-react";
import { TrackingTimeline, type TrackingEventView } from "@/components/TrackingTimeline";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { MOT_LABEL, formatDate } from "@/lib/utils";

type Shipment = {
  lrn: string;
  status: string;
  createdAt: string;
  etaDate: string | null;
  transitDays: number;
  partnerName: string | null;
  mot: string;
  pickupCity: string;
  pickupState: string;
  dropCity: string;
  dropState: string;
  boxCount: number;
  events: TrackingEventView[];
};

export function TrackClient() {
  const params = useSearchParams();
  const initial = params.get("lrn") ?? "";

  const [lrn, setLrn] = useState(initial);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(trimmed)}`);
      const payload = await res.json();
      if (!res.ok) {
        setShipment(null);
        setError(payload.error ?? "We could not find that consignment");
        return;
      }
      setShipment(payload.data.shipment as Shipment);
    } catch {
      setShipment(null);
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep link from the booking success screen and the order page.
  useEffect(() => {
    if (initial) void lookup(initial);
  }, [initial, lookup]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Card>
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(lrn);
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="relative min-w-56 flex-1">
              <label htmlFor="lrn" className="label-caps mb-1 block">
                LRN
              </label>
              <PackageSearch className="pointer-events-none absolute bottom-3 left-3 size-4 text-slate-400" />
              <Input
                id="lrn"
                value={lrn}
                onChange={(e) => setLrn(e.target.value)}
                placeholder="e.g. 357392617"
                className="docnum pl-9 tracking-wider"
                autoComplete="off"
              />
            </div>
            <Button type="submit" loading={loading} disabled={!lrn.trim()}>
              <Radar className="size-4" />
              Track
            </Button>
          </form>
        </CardBody>
      </Card>

      {error && searched && (
        <EmptyState
          icon={PackageSearch}
          title="Consignment not found"
          description={`${error}. Check the LRN on your Lorry Receipt — it is a 9-digit number.`}
          action={<ButtonLink href="/orders" variant="secondary">Browse consignments</ButtonLink>}
        />
      )}

      {shipment && (
        <div className="animate-in-up flex flex-col gap-5">
          <Card>
            <CardHeader
              title={`LRN ${shipment.lrn}`}
              description={`${shipment.boxCount} box${shipment.boxCount === 1 ? "" : "es"} · ${shipment.partnerName ?? "Carrier"} · ${MOT_LABEL[shipment.mot] ?? shipment.mot}`}
              action={<StatusBadge status={shipment.status} />}
            />
            <CardBody className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg bg-slate-50 px-4 py-3">
                <Leg city={shipment.pickupCity} state={shipment.pickupState} label="From" />
                <ArrowRight className="size-4 shrink-0 text-slate-400" />
                <Leg city={shipment.dropCity} state={shipment.dropState} label="To" />

                <div className="ml-auto flex items-center gap-5">
                  <Fact
                    icon={CalendarClock}
                    label="Expected delivery"
                    value={formatDate(shipment.etaDate)}
                  />
                  <Fact icon={Boxes} label="Boxes" value={String(shipment.boxCount)} />
                  <Fact
                    icon={Truck}
                    label="Booked"
                    value={formatDate(shipment.createdAt)}
                  />
                </div>
              </div>

              <TrackingTimeline status={shipment.status} events={shipment.events} />
            </CardBody>
          </Card>

          <ButtonLink href={`/orders/${shipment.lrn}`} variant="secondary" className="self-start">
            Open full consignment record
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

function Leg({ city, state, label }: { city: string; state: string; label: string }) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{city}</p>
      <p className="text-[11px] text-slate-500">{state}</p>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="hidden sm:block">
      <p className="label-caps flex items-center gap-1">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
