import type { Metadata } from "next";
import { PageHero, Section } from "@/components/marketing/PageHero";
import { TrackClient } from "@/components/TrackClient";

export const metadata: Metadata = {
  title: "Track a consignment",
  description: "Look up live movement for any LRN.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ lrn?: string }>;
}) {
  const { lrn } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Tracking"
        title="Where is my consignment?"
        lead="Enter the LRN printed on the Lorry Receipt or on any box tag. No account needed."
      />
      <Section>
        <TrackClient initialLrn={lrn ?? ""} />
      </Section>
    </>
  );
}
