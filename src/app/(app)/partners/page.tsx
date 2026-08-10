import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plane, Train, Truck } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Carriers & rates" };
export const dynamic = "force-dynamic";

const MODE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ROAD: Truck,
  AIR: Plane,
  RAIL: Train,
};

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { rates: true, orders: true } } },
  });

  return (
    <>
      <PageHeader
        title="Carriers & rates"
        description="The panel quoted at booking. Each carrier publishes a lane rate card — the most specific matching lane wins."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {partners.map((partner) => {
          const modes = JSON.parse(partner.modes) as string[];
          const services = JSON.parse(partner.services) as string[];
          const ModeIcon = MODE_ICON[modes[0]] ?? Truck;

          return (
            <Card key={partner.id}>
              <CardHeader
                title={partner.name}
                description={partner.tagline}
                action={
                  <Link
                    href={`/partners/${partner.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline"
                  >
                    Rate card
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                }
              />
              <CardBody className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
                    style={{ backgroundColor: partner.accent }}
                  >
                    <ModeIcon className="size-4.5" />
                  </span>
                  <Badge tone="neutral">{partner.code}</Badge>
                  {modes.map((m) => (
                    <Badge key={m} tone="neutral">
                      {m}
                    </Badge>
                  ))}
                  {services.map((s) => (
                    <Badge key={s} tone="brand">
                      {s}
                    </Badge>
                  ))}
                  {!partner.active && <Badge tone="danger">Inactive</Badge>}
                </div>

                <dl className="grid gap-x-8 sm:grid-cols-2">
                  <DataRow label="Published lanes" value={String(partner._count.rates)} />
                  <DataRow label="Consignments booked" value={String(partner._count.orders)} />
                  <DataRow
                    label="Min chargeable weight"
                    value={`${partner.minChargeableWeight} kg`}
                  />
                  <DataRow label="Volumetric divisor" value={String(partner.volumetricDivisor)} />
                  <DataRow label="Docket charge" value={formatINR(partner.docketCharge)} />
                  <DataRow label="Fuel surcharge" value={`${partner.fuelSurchargePct}%`} />
                  <DataRow
                    label="FOV (carrier risk)"
                    value={`${partner.fovPct}% · min ${formatINR(partner.fovMin)}`}
                  />
                  <DataRow label="ODA charge" value={formatINR(partner.odaCharge)} />
                  <DataRow
                    label="COD handling"
                    value={`${partner.codChargePct}% · min ${formatINR(partner.codChargeMin)}`}
                  />
                  <DataRow label="GST" value={`${partner.gstPct}%`} />
                </dl>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
