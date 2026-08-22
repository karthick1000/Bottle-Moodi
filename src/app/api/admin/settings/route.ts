import { NextRequest } from "next/server";
import { z } from "zod";
import { getSettingsUncached, saveSettings } from "@/lib/db/settings";
import { getAdminUserId, jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

// Admin data must never be served from a cached render.
export const dynamic = "force-dynamic";

const imageUrl = z.string().url().or(z.literal("")).optional();

const settingsSchema = z.object({
  tagline:        z.string().max(200).optional(),
  headline:       z.string().max(200).optional(),
  strip:          z.string().max(200).optional(),
  studioPhotoUrl: imageUrl,
  teeMockupUrl:   imageUrl,
  toteMockupUrl:  imageUrl,
});

export async function GET(req: NextRequest) {
  try {
    await getAdminUserId(req);
    return jsonOk(await getSettingsUncached());
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to load settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await getAdminUserId(req);
    const body = await parseBody(req, settingsSchema);
    return jsonOk(await saveSettings(body));
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to save settings", 500);
  }
}
