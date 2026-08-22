import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAdminUserId } from "@/lib/apiHelpers";
import { addProductImage } from "@/lib/db/productImages";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    await getAdminUserId(req);
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;

  // productId is optional: omit it for standalone imagery (e.g. the homepage
  // studio photo), which uploads to Cloudinary without a ProductImage row.
  const rawProductId = formData.get("productId");
  const hasProduct   = rawProductId != null && rawProductId !== "";
  const productId    = hasProduct ? Number(rawProductId) : null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (hasProduct && (!productId || isNaN(productId)))
    return NextResponse.json({ error: "productId must be a number" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:        "bottlemoodi/products",
          resource_type: "image",
          quality:       "auto:best",
          format:        "webp",
        },
        (err, res) => {
          if (err || !res) reject(err ?? new Error("Upload failed"));
          else resolve(res as { secure_url: string; public_id: string });
        }
      ).end(buffer);
    }
  );

  // Save URL to DB atomically with the upload (product images only)
  const image = productId ? await addProductImage(productId, result.secure_url) : null;

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id, image });
}
