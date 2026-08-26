-- Tags move from a hard-coded list + a free-text Product.tag column into a
-- table the admin can edit. Product.tag becomes a nullable FK so renaming a
-- tag relabels every poster on it, and deleting one untags rather than
-- deletes the posters.

CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tag_label_key" ON "Tag"("label");
CREATE INDEX "Tag_position_idx" ON "Tag"("position");

-- Seed the four chips the storefront shipped with, in their original order.
INSERT INTO "Tag" ("label", "position")
VALUES ('SIGNBOARD', 0), ('OORU', 1), ('SLANG', 2), ('NOSTALGIA', 3)
ON CONFLICT ("label") DO NOTHING;

-- Then any other label already sitting on a product, appended after them.
INSERT INTO "Tag" ("label", "position")
SELECT DISTINCT p."tag", 100
FROM "Product" p
WHERE p."tag" IS NOT NULL AND p."tag" <> ''
ON CONFLICT ("label") DO NOTHING;

ALTER TABLE "Product" ADD COLUMN "tagId" INTEGER;

UPDATE "Product" p SET "tagId" = t."id" FROM "Tag" t WHERE t."label" = p."tag";

ALTER TABLE "Product" DROP COLUMN "tag";

ALTER TABLE "Product" ADD CONSTRAINT "Product_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Product_tagId_idx" ON "Product"("tagId");
