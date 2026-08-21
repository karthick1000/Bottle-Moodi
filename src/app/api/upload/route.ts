import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAdminUserId } from "@/lib/apiHelpers";

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
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

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

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
}
