import type { Metadata } from "next";
import { PageHeader } from "@/components/AppShell";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book a shipment",
  description: "Create a B2B consignment, compare carrier rates and generate the LR.",
};

export default function BookPage() {
  return (
    <>
      <PageHeader
        title="Book a shipment"
        description="Capture the lane, the paperwork and the cartons — then pick a carrier. The LR and box tags are generated the moment you confirm."
      />
      <BookingWizard />
    </>
  );
}
