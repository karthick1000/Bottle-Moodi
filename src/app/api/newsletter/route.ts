import { NextRequest } from "next/server";
import { subscribeEmail } from "@/lib/db/newsletter";
import { newsletterSchema } from "@/lib/validators";
import { jsonOk, jsonErr, parseBody } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, newsletterSchema);
    const result = await subscribeEmail(body.email);
    if (result.alreadySubscribed) {
      return jsonErr("Already subscribed", 409);
    }
    return jsonOk({ subscribed: true });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to subscribe", 500);
  }
}
