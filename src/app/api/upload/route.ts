import { NextRequest, NextResponse } from "next/server";

// ── Cloudinary upload endpoint ─────────────────────────────────────────────
// Requires in .env.local:
//   CLOUDINARY_CLOUD_NAME=your_cloud
//   CLOUDINARY_API_KEY=your_key
//   CLOUDINARY_API_SECRET=your_secret
//
// Install:  npm install cloudinary
// Then uncomment the import below and remove the stub response.
// ──────────────────────────────────────────────────────────────────────────

// import { v2 as cloudinary } from "cloudinary";
//
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
//   api_key:    process.env.CLOUDINARY_API_KEY!,
//   api_secret: process.env.CLOUDINARY_API_SECRET!,
// });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── STUB (remove once Cloudinary is configured) ────────────────────────
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({
      url: null,
      message: "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local",
    }, { status: 200 });
  }
  // ──────────────────────────────────────────────────────────────────────

  /* Live Cloudinary upload (uncomment when env vars are set):
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "bottlemoodi/products", resource_type: "image" },
      (err, res) => { err ? reject(err) : resolve(res as { secure_url: string }); }
    ).end(buffer);
  });

  return NextResponse.json({ url: result.secure_url });
  */

  return NextResponse.json({ url: null, message: "Upload stub" });
}
