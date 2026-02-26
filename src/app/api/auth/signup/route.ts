import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() || undefined : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists. Sign in or use another email." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Sign-up error:", e);

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { message: "An account with this email already exists. Sign in or use another email." },
          { status: 409 }
        );
      }
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid request. Please try again." },
        { status: 400 }
      );
    }

    const message =
      process.env.NODE_ENV === "development" && e instanceof Error
        ? e.message
        : "Something went wrong. Please try again.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
