/**
 * Demo consignments.
 *
 * Prices are produced by the real rating engine rather than hard-coded, so the
 * seeded orders stay consistent with whatever the carrier rate cards say — a
 * demo where the dashboard totals disagree with a re-quote is worse than no
 * demo at all.
 */
import type { PrismaClient } from "../src/generated/prisma";
import { boxAwb, formatDocumentNumbers } from "../src/lib/docNumbers";
import { priceWithPartner, type PartnerCommercials } from "../src/lib/pricing";

type Party = {
  company: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
};

type DemoBox = { count: number; description: string; ref: string; kg: number; dims: [number, number, number] };

type DemoOrder = {
  partnerCode: string;
  bookedDaysAgo: number;
  status: string;
  from: Party;
  to: Party;
  invoiceNumber: string;
  invoiceAmount: number;
  ewayBill?: string;
  mot: "ROAD" | "AIR" | "RAIL";
  riskType: "OWNER" | "CARRIER";
  invoiceValuePayment: "PREPAID" | "COD";
  freightPayment: "BTC" | "PAID" | "TO_PAY";
  product: string;
  saidToContain: string;
  remarks?: string;
  boxes: DemoBox[];
  /** Scan trail, oldest first. `hoursAfterBooking` positions each scan. */
  trail: Array<{ status: string; location: string; remarks?: string; hoursAfterBooking: number }>;
};

const party = (p: Party) => p;

const DELHI = party({
  company: "Amwoodo Eco Products Pvt Ltd",
  contact: "Ravi Menon",
  phone: "9810012345",
  email: "despatch@amwoodo.example",
  address: "246/68 Master Complex, Near Prince Apartment, I.P. Extension",
  city: "Delhi",
  state: "Delhi",
  pincode: "110092",
  gstin: "07AAFCS4417K1ZP",
});

const KOLKATA = party({
  company: "Bengal Hospitality Supplies",
  contact: "Ramesh Sarkar",
  phone: "9830098765",
  email: "stores@bengalhospitality.example",
  address: "Plot 14, Sector V, Salt Lake, Bidhannagar",
  city: "Kolkata",
  state: "West Bengal",
  pincode: "700091",
  gstin: "19AAFCS4417K1Z4",
});

const MUMBAI = party({
  company: "Sahyadri Components Pvt Ltd",
  contact: "Priya Deshmukh",
  phone: "9820011223",
  email: "logistics@sahyadri.example",
  address: "Unit 7, Marol MIDC, Andheri East",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400093",
  gstin: "27AABCS1429P1ZL",
});

const BENGALURU = party({
  company: "Nandi Electricals Ltd",
  contact: "Arjun Rao",
  phone: "9845567788",
  email: "inward@nandielec.example",
  address: "No. 42, Peenya Industrial Area Phase II",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560058",
  gstin: "29AACCN2233F1Z9",
});

const AHMEDABAD = party({
  company: "Sabarmati Textiles LLP",
  contact: "Nikhil Patel",
  phone: "9825566778",
  email: "despatch@sabarmatitex.example",
  address: "Survey 210, Narol Circle, Aslali Road",
  city: "Ahmedabad",
  state: "Gujarat",
  pincode: "382405",
  gstin: "24AAGFS8812M1ZQ",
});

const CHENNAI = party({
  company: "Marina Retail Distribution",
  contact: "Lakshmi Iyer",
  phone: "9840033445",
  email: "warehouse@marinaretail.example",
  address: "Godown 3, Ambattur Industrial Estate, Thiruvallur High Road",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600058",
  gstin: "33AAHCM5567J1ZB",
});

const GURUGRAM = party({
  company: "Aravalli Instruments Pvt Ltd",
  contact: "Sameer Khanna",
  phone: "9871122334",
  email: "shipping@aravalliinst.example",
  address: "Plot 88, Udyog Vihar Phase IV",
  city: "Gurugram",
  state: "Haryana",
  pincode: "122015",
  gstin: "06AAECA9910L1ZD",
});

const GUWAHATI = party({
  company: "Brahmaputra Traders",
  contact: "Bhaskar Das",
  phone: "9864455667",
  email: "orders@brahmaputratraders.example",
  address: "GS Road, Bhangagarh, Near Down Town Hospital",
  city: "Guwahati",
  state: "Assam",
  pincode: "781005",
  gstin: "18AAKFB3321R1ZT",
});

const PUNE = party({
  company: "Deccan Precision Works",
  contact: "Meera Kulkarni",
  phone: "9822244556",
  email: "despatch@deccanprecision.example",
  address: "Gat 145, Chakan MIDC Phase I",
  city: "Pune",
  state: "Maharashtra",
  pincode: "410501",
  gstin: "27AADFD7788K1ZM",
});

const JAIPUR = party({
  company: "Pink City Hardware Mart",
  contact: "Vikram Sharma",
  phone: "9829933445",
  email: "purchase@pinkcityhardware.example",
  address: "Shop 22, Transport Nagar, Sitapura",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302022",
  gstin: "08AAJFP2244N1ZW",
});

const COIMBATORE = party({
  company: "Kongu Pumps & Motors",
  contact: "Senthil Kumar",
  phone: "9843366778",
  email: "despatch@kongupumps.example",
  address: "SF 88, Kurichi Industrial Estate",
  city: "Coimbatore",
  state: "Tamil Nadu",
  pincode: "641021",
  gstin: "33AAGFK6677H1ZY",
});

const HYDERABAD = party({
  company: "Deccan Agro Equipment",
  contact: "Farhan Ali",
  phone: "9848877665",
  email: "stores@deccanagro.example",
  address: "Plot 56, IDA Jeedimetla Phase III",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500055",
  gstin: "36AABCD3344Q1ZK",
});

export const DEMO_ORDERS: DemoOrder[] = [
  {
    partnerCode: "IRC",
    bookedDaysAgo: 9,
    status: "DELIVERED",
    from: DELHI,
    to: KOLKATA,
    invoiceNumber: "AMW/26-27/0184",
    invoiceAmount: 500000,
    ewayBill: "341096710178",
    mot: "ROAD",
    riskType: "CARRIER",
    invoiceValuePayment: "PREPAID",
    freightPayment: "BTC",
    product: "Bamboo tableware",
    saidToContain: "Bamboo tableware — 10 cartons",
    remarks: "Dock 3, deliver before 1800 hrs",
    boxes: [{ count: 10, description: "Bamboo dinner plates 9in", ref: "SKU-BM-900", kg: 50, dims: [40, 40, 20] }],
    trail: [
      { status: "BOOKED", location: "Delhi, Delhi", hoursAfterBooking: 0, remarks: "Consignment booked. 10 box(es) manifested." },
      { status: "PICKED_UP", location: "Delhi — I.P. Extension", hoursAfterBooking: 6, remarks: "10 boxes collected, seals intact" },
      { status: "IN_TRANSIT", location: "Kanpur transit hub", hoursAfterBooking: 30 },
      { status: "IN_TRANSIT", location: "Varanasi transit hub", hoursAfterBooking: 54 },
      { status: "REACHED_DESTINATION_HUB", location: "Kolkata — Dankuni hub", hoursAfterBooking: 96 },
      { status: "OUT_FOR_DELIVERY", location: "Kolkata — Salt Lake", hoursAfterBooking: 108, remarks: "Vehicle WB23F4471" },
      { status: "DELIVERED", location: "Kolkata — Salt Lake", hoursAfterBooking: 114, remarks: "Received by Ramesh Sarkar. All 10 boxes okay." },
    ],
  },
  {
    partnerCode: "VCX",
    bookedDaysAgo: 2,
    status: "IN_TRANSIT",
    from: MUMBAI,
    to: BENGALURU,
    invoiceNumber: "SAH/26/1129",
    invoiceAmount: 218400,
    ewayBill: "781140922356",
    mot: "AIR",
    riskType: "CARRIER",
    invoiceValuePayment: "PREPAID",
    freightPayment: "PAID",
    product: "Precision machined components",
    saidToContain: "CNC components — 4 cases",
    remarks: "Fragile. Do not stack above 3 tiers.",
    boxes: [{ count: 4, description: "CNC housing assemblies", ref: "PO-4471", kg: 22.5, dims: [60, 45, 35] }],
    trail: [
      { status: "BOOKED", location: "Mumbai, Maharashtra", hoursAfterBooking: 0, remarks: "Consignment booked. 4 box(es) manifested." },
      { status: "PICKED_UP", location: "Mumbai — Marol MIDC", hoursAfterBooking: 4 },
      { status: "IN_TRANSIT", location: "Mumbai — CSMIA air cargo terminal", hoursAfterBooking: 11, remarks: "Uplifted on flight to BLR" },
    ],
  },
  {
    partnerCode: "MRF",
    bookedDaysAgo: 4,
    status: "OUT_FOR_DELIVERY",
    from: AHMEDABAD,
    to: CHENNAI,
    invoiceNumber: "STX/2026/0662",
    invoiceAmount: 742000,
    ewayBill: "556102344781",
    mot: "ROAD",
    riskType: "CARRIER",
    invoiceValuePayment: "PREPAID",
    freightPayment: "BTC",
    product: "Cotton furnishing fabric",
    saidToContain: "Cotton furnishing rolls — 25 bales",
    boxes: [{ count: 25, description: "Cotton furnishing fabric roll", ref: "BALE-2026", kg: 38, dims: [110, 45, 45] }],
    trail: [
      { status: "BOOKED", location: "Ahmedabad, Gujarat", hoursAfterBooking: 0, remarks: "Consignment booked. 25 box(es) manifested." },
      { status: "PICKED_UP", location: "Ahmedabad — Narol", hoursAfterBooking: 8 },
      { status: "IN_TRANSIT", location: "Pune transit hub", hoursAfterBooking: 34 },
      { status: "IN_TRANSIT", location: "Bengaluru transit hub", hoursAfterBooking: 62 },
      { status: "REACHED_DESTINATION_HUB", location: "Chennai — Ambattur hub", hoursAfterBooking: 84 },
      { status: "OUT_FOR_DELIVERY", location: "Chennai — Ambattur", hoursAfterBooking: 92, remarks: "Vehicle TN22BX9013" },
    ],
  },
  {
    partnerCode: "NSP",
    bookedDaysAgo: 3,
    status: "PICKED_UP",
    from: GURUGRAM,
    to: GUWAHATI,
    invoiceNumber: "ARV/26/0311",
    invoiceAmount: 96500,
    ewayBill: "220913447561",
    mot: "ROAD",
    riskType: "OWNER",
    invoiceValuePayment: "COD",
    freightPayment: "TO_PAY",
    product: "Laboratory instruments",
    saidToContain: "Lab instruments — 6 cartons",
    remarks: "ODA location. Call consignee before final leg.",
    boxes: [{ count: 6, description: "Benchtop analyser unit", ref: "INST-88", kg: 14, dims: [55, 40, 40] }],
    trail: [
      { status: "BOOKED", location: "Gurugram, Haryana", hoursAfterBooking: 0, remarks: "Consignment booked. 6 box(es) manifested." },
      { status: "PICKED_UP", location: "Gurugram — Udyog Vihar", hoursAfterBooking: 9, remarks: "ODA surcharge applies for Guwahati last mile" },
    ],
  },
  {
    partnerCode: "BLL",
    bookedDaysAgo: 0,
    status: "BOOKED",
    from: PUNE,
    to: JAIPUR,
    invoiceNumber: "DPW/26/0907",
    invoiceAmount: 41800,
    mot: "ROAD",
    riskType: "OWNER",
    invoiceValuePayment: "PREPAID",
    freightPayment: "BTC",
    product: "Hardware fittings",
    saidToContain: "Hardware fittings — 2 cartons",
    boxes: [{ count: 2, description: "Assorted brass fittings", ref: "HW-2210", kg: 31, dims: [50, 40, 30] }],
    trail: [
      { status: "BOOKED", location: "Pune, Maharashtra", hoursAfterBooking: 0, remarks: "Consignment booked. 2 box(es) manifested." },
    ],
  },
  {
    partnerCode: "MRF",
    bookedDaysAgo: 5,
    status: "REACHED_DESTINATION_HUB",
    from: COIMBATORE,
    to: HYDERABAD,
    invoiceNumber: "KPM/26/1442",
    invoiceAmount: 386000,
    ewayBill: "664201558930",
    mot: "ROAD",
    riskType: "CARRIER",
    invoiceValuePayment: "PREPAID",
    freightPayment: "BTC",
    product: "Submersible pump sets",
    saidToContain: "Submersible pump sets — 12 crates",
    boxes: [{ count: 12, description: "5HP submersible pump set", ref: "PMP-5H", kg: 42, dims: [70, 35, 35] }],
    trail: [
      { status: "BOOKED", location: "Coimbatore, Tamil Nadu", hoursAfterBooking: 0, remarks: "Consignment booked. 12 box(es) manifested." },
      { status: "PICKED_UP", location: "Coimbatore — Kurichi", hoursAfterBooking: 7 },
      { status: "IN_TRANSIT", location: "Bengaluru transit hub", hoursAfterBooking: 28 },
      { status: "REACHED_DESTINATION_HUB", location: "Hyderabad — Jeedimetla hub", hoursAfterBooking: 76, remarks: "Awaiting delivery slot from consignee" },
    ],
  },
];

const hoursAgo = (now: Date, h: number) => new Date(now.getTime() - h * 3_600_000);

export async function seedDemoOrders(
  prisma: PrismaClient,
  partners: PartnerCommercials[],
  now: Date,
): Promise<number> {
  const byCode = new Map(partners.map((p) => [p.code, p]));
  let seq = 0;

  for (const demo of DEMO_ORDERS) {
    const partner = byCode.get(demo.partnerCode);
    if (!partner) continue;

    // Expand the grouped carton spec into individual boxes.
    const boxes = demo.boxes.flatMap((group, gi) =>
      Array.from({ length: group.count }, (_, i) => ({
        boxNumber: gi * 100 + i + 1,
        description: group.description,
        referenceId: `${group.ref}-${String(i + 1).padStart(2, "0")}`,
        weightKg: group.kg,
        lengthCm: group.dims[0],
        widthCm: group.dims[1],
        heightCm: group.dims[2],
      })),
    );

    const bookedAt = hoursAgo(now, demo.bookedDaysAgo * 24 + 3);

    // Rate at the time of booking, exactly as the API would have.
    const quote = priceWithPartner(
      partner,
      {
        originState: demo.from.state,
        originCity: demo.from.city,
        destState: demo.to.state,
        destCity: demo.to.city,
        boxes,
        invoiceAmount: demo.invoiceAmount,
        riskType: demo.riskType,
        invoiceValuePayment: demo.invoiceValuePayment,
      },
      bookedAt,
    );

    seq += 1;
    const { lrn, oid, mawb } = formatDocumentNumbers(seq);

    await prisma.order.create({
      data: {
        lrn,
        oid,
        mawb,
        status: demo.status,
        createdAt: bookedAt,

        pickupCompany: demo.from.company,
        pickupProduct: demo.product,
        pickupContact: demo.from.contact,
        pickupEmail: demo.from.email,
        pickupPhone: demo.from.phone,
        pickupAddress: demo.from.address,
        pickupCity: demo.from.city,
        pickupState: demo.from.state,
        pickupPincode: demo.from.pincode,
        pickupGstin: demo.from.gstin,

        dropCompany: demo.to.company,
        dropProduct: demo.product,
        dropContact: demo.to.contact,
        dropEmail: demo.to.email,
        dropPhone: demo.to.phone,
        dropAddress: demo.to.address,
        dropCity: demo.to.city,
        dropState: demo.to.state,
        dropPincode: demo.to.pincode,
        dropGstin: demo.to.gstin,

        invoiceNumber: demo.invoiceNumber,
        invoiceAmount: demo.invoiceAmount,
        ewayBill: demo.ewayBill ?? null,

        mot: demo.mot,
        pickupType: "SCHEDULED_PICKUP",
        deliveryType: "DOOR_DELIVERY",
        freightPayment: demo.freightPayment,
        invoiceValuePayment: demo.invoiceValuePayment,
        riskType: demo.riskType,
        podOnInvoice: demo.invoiceAmount > 250_000,
        saidToContain: demo.saidToContain,
        remarks: demo.remarks ?? null,

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
          create: boxes.map((b) => ({
            boxNumber: b.boxNumber,
            awb: boxAwb(lrn, b.boxNumber),
            description: b.description,
            referenceId: b.referenceId,
            weightKg: b.weightKg,
            lengthCm: b.lengthCm,
            widthCm: b.widthCm,
            heightCm: b.heightCm,
          })),
        },
        events: {
          create: demo.trail.map((e) => ({
            status: e.status,
            location: e.location,
            remarks: e.remarks ?? null,
            createdAt: new Date(bookedAt.getTime() + e.hoursAfterBooking * 3_600_000),
          })),
        },
      },
    });
  }

  // Advance the shared counter past the demo range so the first real booking
  // cannot collide with a seeded LRN.
  await prisma.counter.upsert({
    where: { key: "shipment" },
    create: { key: "shipment", value: seq },
    update: { value: seq },
  });

  return seq;
}
