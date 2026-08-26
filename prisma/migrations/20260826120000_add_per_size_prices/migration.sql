-- Per-size pricing. "base" keeps its meaning as the A4 price; A3 and A2 move
-- from the hard-coded SIZE_UPCHARGE table into editable columns.
-- Backfill with the old upcharges (A3 +150, A2 +350) so no live price moves.
ALTER TABLE "Product" ADD COLUMN "priceA3" INTEGER;
ALTER TABLE "Product" ADD COLUMN "priceA2" INTEGER;

UPDATE "Product" SET "priceA3" = "base" + 150, "priceA2" = "base" + 350;

ALTER TABLE "Product" ALTER COLUMN "priceA3" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "priceA2" SET NOT NULL;
