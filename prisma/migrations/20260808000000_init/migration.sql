-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "modes" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "minChargeableWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "volumetricDivisor" INTEGER NOT NULL DEFAULT 5000,
    "fuelSurchargePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "docketCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fovPct" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "fovMin" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "odaCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codChargePct" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "codChargeMin" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "gstPct" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "originState" TEXT NOT NULL DEFAULT '*',
    "originCity" TEXT NOT NULL DEFAULT '*',
    "destState" TEXT NOT NULL DEFAULT '*',
    "destCity" TEXT NOT NULL DEFAULT '*',
    "ratePerKg" DOUBLE PRECISION NOT NULL,
    "minCharge" DOUBLE PRECISION NOT NULL,
    "transitDays" INTEGER NOT NULL,
    "oda" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "lrn" TEXT NOT NULL,
    "oid" TEXT NOT NULL,
    "mawb" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "pickupCompany" TEXT NOT NULL,
    "pickupProduct" TEXT NOT NULL,
    "pickupContact" TEXT,
    "pickupEmail" TEXT,
    "pickupPhone" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupPincode" TEXT NOT NULL,
    "pickupLandmark" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "pickupGstin" TEXT,
    "dropCompany" TEXT NOT NULL,
    "dropProduct" TEXT NOT NULL,
    "dropContact" TEXT,
    "dropEmail" TEXT,
    "dropPhone" TEXT,
    "dropAddress" TEXT NOT NULL,
    "dropCity" TEXT NOT NULL,
    "dropState" TEXT NOT NULL,
    "dropPincode" TEXT NOT NULL,
    "dropLat" DOUBLE PRECISION,
    "dropLng" DOUBLE PRECISION,
    "dropGstin" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ewayBill" TEXT,
    "mot" TEXT NOT NULL DEFAULT 'ROAD',
    "pickupType" TEXT NOT NULL DEFAULT 'SELF_DROP',
    "deliveryType" TEXT NOT NULL DEFAULT 'SELF_COLLECT',
    "freightPayment" TEXT NOT NULL DEFAULT 'BTC',
    "invoiceValuePayment" TEXT NOT NULL DEFAULT 'PREPAID',
    "riskType" TEXT NOT NULL DEFAULT 'OWNER',
    "podOnInvoice" BOOLEAN NOT NULL DEFAULT false,
    "saidToContain" TEXT NOT NULL,
    "remarks" TEXT,
    "partnerId" TEXT,
    "partnerName" TEXT,
    "partnerCode" TEXT,
    "actualWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumetricWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chargedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "docketCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fov" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "odaCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transitDays" INTEGER NOT NULL DEFAULT 0,
    "etaDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "boxNumber" INTEGER NOT NULL,
    "awb" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "lengthCm" DOUBLE PRECISION NOT NULL,
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_code_key" ON "Partner"("code");

-- CreateIndex
CREATE INDEX "Rate_partnerId_idx" ON "Rate"("partnerId");

-- CreateIndex
CREATE INDEX "Rate_destState_destCity_idx" ON "Rate"("destState", "destCity");

-- CreateIndex
CREATE UNIQUE INDEX "Order_lrn_key" ON "Order"("lrn");

-- CreateIndex
CREATE UNIQUE INDEX "Order_oid_key" ON "Order"("oid");

-- CreateIndex
CREATE UNIQUE INDEX "Order_mawb_key" ON "Order"("mawb");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Box_orderId_idx" ON "Box"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Box_orderId_boxNumber_key" ON "Box"("orderId", "boxNumber");

-- CreateIndex
CREATE INDEX "TrackingEvent_orderId_idx" ON "TrackingEvent"("orderId");

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
