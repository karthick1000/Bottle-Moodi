-- Drop imageUrl from Product (replaced by ProductImage table)
ALTER TABLE "Product" DROP COLUMN IF EXISTS "imageUrl";

-- Create ProductImage table
CREATE TABLE "ProductImage" (
    "id"        SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "url"       TEXT NOT NULL,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- Foreign key with cascade delete
ALTER TABLE "ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
