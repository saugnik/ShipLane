import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/AppShell";
import { TrackClient } from "@/components/TrackClient";

export const metadata: Metadata = {
  title: "Track a consignment",
  description: "Look up live movement for any LRN.",
};

export default function TrackPage() {
  return (
    <>
      <PageHeader
        title="Track a consignment"
        description="Enter the LRN printed on the Lorry Receipt or on any box tag."
      />
      <Suspense>
        <TrackClient />
      </Suspense>
    </>
  );
}
