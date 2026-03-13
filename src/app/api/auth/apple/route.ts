import { NextResponse } from "next/server";

/**
 * Sign in with Apple (for iOS app). Not yet implemented.
 * When implementing: verify Apple ID token, find or create user by email, return { token, user }.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: "Sign in with Apple is not yet implemented. Use Google or email/password." },
    { status: 501 }
  );
}
