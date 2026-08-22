import { getSettings } from "@/lib/db/settings";
import { jsonOk, jsonErr } from "@/lib/apiHelpers";

/** Public read of the editable homepage content. No auth — this is the copy
 *  and imagery already rendered on the storefront. */
export async function GET() {
  try {
    return jsonOk(await getSettings());
  } catch {
    return jsonErr("Failed to load settings", 500);
  }
}
