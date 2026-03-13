import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/api-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }
    if (!GOOGLE_CLIENT_ID) {
      console.error("[API auth/google] GOOGLE_CLIENT_ID not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.json(
        { error: "Invalid Google token" },
        { status: 401 }
      );
    }

    const email = payload.email;
    const name = payload.name ?? null;
    const image = payload.picture ?? null;

    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, profession: true },
    });

    if (!user) {
      const created = await prisma.user.create({
        data: { email, name, image },
        select: { id: true, email: true, name: true, profession: true },
      });
      user = created;
    }

    const token = await signToken({ sub: user.id, email: user.email });
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profession: user.profession,
      },
    });
  } catch (e) {
    console.error("[API auth/google]", e);
    return NextResponse.json(
      { error: "Invalid Google token or server error" },
      { status: 401 }
    );
  }
}
