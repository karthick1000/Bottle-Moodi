import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodSchema, ZodError } from "zod";
// ZodError in v4 uses .issues instead of .errors
type ZodIssue = { message: string };

function makeJsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function getAuthUserId(_req: NextRequest): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw makeJsonResponse({ error: "Unauthorized" }, 401);
  }
  return userId;
}

export async function getAdminUserId(req: NextRequest): Promise<string> {
  const userId = await getAuthUserId(req);
  const adminId = process.env.ADMIN_CLERK_USER_ID;
  if (!adminId || userId !== adminId) {
    throw makeJsonResponse({ error: "Forbidden" }, 403);
  }
  return userId;
}

export function jsonOk(data: unknown): Response {
  return NextResponse.json(data, { status: 200 });
}

export function jsonErr(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
}

export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw makeJsonResponse({ error: "Invalid JSON" }, 400);
  }
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = (err as unknown as { issues: ZodIssue[] }).issues;
      throw makeJsonResponse(
        { error: issues?.[0]?.message ?? "Validation error" },
        400
      );
    }
    throw err;
  }
}
