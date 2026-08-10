-- Collapse pickupProduct / dropProduct into a single shipment-level `product`.
--
-- Written by hand rather than generated, because the generated form would drop
-- both columns and add an empty NOT NULL one, losing the value on every
-- existing consignment. Add nullable, backfill, then tighten.

ALTER TABLE "Order" ADD COLUMN "product" TEXT;

-- Both columns have always been written with the same value, so prefer the
-- shipper's and fall back to the consignee's if it was ever blank.
UPDATE "Order"
   SET "product" = COALESCE(NULLIF(TRIM("pickupProduct"), ''), NULLIF(TRIM("dropProduct"), ''), 'Goods');

ALTER TABLE "Order" ALTER COLUMN "product" SET NOT NULL;

ALTER TABLE "Order" DROP COLUMN "pickupProduct";
ALTER TABLE "Order" DROP COLUMN "dropProduct";
