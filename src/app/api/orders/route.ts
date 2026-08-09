import { handle, HttpError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { boxAwb, generateDocumentNumbers } from "@/lib/ids";
import { buildOrderFilter } from "@/lib/orderFilter";
import { loadPartnerCommercials } from "@/lib/partners";
import { priceWithPartner } from "@/lib/pricing";
import { createOrderSchema } from "@/lib/validation";

const PAGE_SIZE = 20;

/** Paginated order list with free-text search across LRN, docket and party names. */
export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

    const where = buildOrderFilter(q, status);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { _count: { select: { boxes: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => ({ ...o, boxCount: o._count.boxes })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  });
}

/**
 * Books a consignment.
 *
 * The price shown at checkout is never trusted from the client — we re-rate
 * server-side with the selected carrier and freeze that breakup onto the order,
 * so the LR and the invoice can never disagree with what was quoted.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const input = createOrderSchema.parse(body);

    const [partner] = await loadPartnerCommercials(input.partnerId);
    if (!partner) throw new HttpError("The selected delivery partner is unavailable", 404);

    const quote = priceWithPartner(partner, {
      originState: input.pickup.state,
      originCity: input.pickup.city,
      destState: input.drop.state,
      destCity: input.drop.city,
      boxes: input.boxes,
      invoiceAmount: input.invoice.invoiceAmount,
      riskType: input.shipment.riskType,
      invoiceValuePayment: input.shipment.invoiceValuePayment,
    });

    const { lrn, oid, mawb } = await generateDocumentNumbers();

    const order = await prisma.order.create({
      data: {
        lrn,
        oid,
        mawb,
        status: "BOOKED",

        pickupCompany: input.pickup.company,
        pickupProduct: input.pickup.product,
        pickupContact: input.pickup.contact,
        pickupEmail: input.pickup.email || null,
        pickupPhone: input.pickup.phone || null,
        pickupAddress: input.pickup.address,
        pickupCity: input.pickup.city,
        pickupState: input.pickup.state,
        pickupPincode: input.pickup.pincode,
        pickupLat: input.pickup.lat,
        pickupLng: input.pickup.lng,
        pickupGstin: input.pickup.gstin || null,

        dropCompany: input.drop.company,
        dropProduct: input.drop.product,
        dropContact: input.drop.contact,
        dropEmail: input.drop.email || null,
        dropPhone: input.drop.phone || null,
        dropAddress: input.drop.address,
        dropCity: input.drop.city,
        dropState: input.drop.state,
        dropPincode: input.drop.pincode,
        dropLat: input.drop.lat,
        dropLng: input.drop.lng,
        dropGstin: input.drop.gstin || null,

        invoiceNumber: input.invoice.invoiceNumber,
        invoiceAmount: input.invoice.invoiceAmount,
        ewayBill: input.invoice.ewayBill || null,

        mot: input.shipment.mot,
        pickupType: input.shipment.pickupType,
        deliveryType: input.shipment.deliveryType,
        freightPayment: input.shipment.freightPayment,
        invoiceValuePayment: input.shipment.invoiceValuePayment,
        riskType: input.shipment.riskType,
        podOnInvoice: input.shipment.podOnInvoice,
        saidToContain: input.shipment.saidToContain,
        remarks: input.shipment.remarks,

        partnerId: partner.id,
        partnerName: partner.name,
        partnerCode: partner.code,

        actualWeight: quote.actualWeight,
        volumetricWeight: quote.volumetricWeight,
        chargedWeight: quote.chargedWeight,
        ratePerKg: quote.ratePerKg,
        freight: quote.freight,
        docketCharge: quote.docketCharge,
        fuelSurcharge: quote.fuelSurcharge,
        fov: quote.fov,
        odaCharge: quote.odaCharge,
        codCharge: quote.codCharge,
        subtotal: quote.subtotal,
        gstAmount: quote.gstAmount,
        grandTotal: quote.grandTotal,
        transitDays: quote.transitDays,
        etaDate: new Date(quote.etaDate),

        boxes: {
          create: input.boxes.map((b) => ({
            boxNumber: b.boxNumber,
            awb: boxAwb(lrn, b.boxNumber),
            description: b.description,
            referenceId: b.referenceId ?? null,
            weightKg: b.weightKg,
            lengthCm: b.lengthCm,
            widthCm: b.widthCm,
            heightCm: b.heightCm,
          })),
        },
        events: {
          create: {
            status: "BOOKED",
            location: `${input.pickup.city}, ${input.pickup.state}`,
            remarks: `Consignment booked with ${partner.name}. ${input.boxes.length} box(es) manifested.`,
          },
        },
      },
      include: { boxes: true, events: true },
    });

    return { order, quote };
  });
}
