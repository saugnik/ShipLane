import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { RateCardEditor } from "@/components/RateCardEditor";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id }, select: { name: true } });
  return { title: partner ? `${partner.name} — rate card` : "Carrier" };
}

export default async function PartnerPage({ params }: { params: Params }) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) notFound();

  const modes = JSON.parse(partner.modes) as string[];

  return (
    <>
      <Link
        href="/partners"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        All carriers
      </Link>

      <PageHeader
        title={partner.name}
        description={partner.tagline}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{partner.code}</Badge>
            {modes.map((m) => (
              <Badge key={m} tone="brand">
                {m}
              </Badge>
            ))}
          </div>
        }
      />

      <RateCardEditor partnerId={partner.id} />
    </>
  );
}
