import { NextResponse } from "next/server";
import type { ApiUser } from "@/lib/api-auth";
import { getUserFromBearerToken } from "@/lib/api-auth";

/** Use in API route: const [err, user] = await requireAuth(request); if (err) return err; */
export async function requireAuth(
  request: Request
): Promise<[NextResponse, null] | [null, ApiUser]> {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return [
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      null,
    ];
  }
  return [null, user];
}
