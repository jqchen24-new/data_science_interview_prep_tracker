import { SignJWT, jwtVerify } from "jose";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

const JWT_ISSUER = "the-offer-lab-api";
const JWT_AUDIENCE = "the-offer-lab-mobile";
const JWT_EXPIRY = "30d";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is required for API auth");
  return new TextEncoder().encode(secret);
}

export type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
  profession: string | null;
};

/** Sign a JWT for the given user (for mobile API). */
export async function signToken(payload: { sub: string; email?: string | null }): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

/** Verify API JWT and return payload (sub = userId). */
export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const sub = payload.sub as string;
    if (!sub) return null;
    return { sub };
  } catch {
    return null;
  }
}

/** Get user from Authorization: Bearer <token>. Returns null if missing or invalid. */
export async function getUserFromBearerToken(request: Request): Promise<ApiUser | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, profession: true },
  });
  return user;
}

/** Validate email/password and return user (for token endpoint). */
export async function validateCredentials(
  email: string,
  password: string
): Promise<{ id: string; email: string | null; name: string | null } | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) return null;
  const user = await prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  if (!user?.passwordHash) return null;
  const ok = await compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name };
}
