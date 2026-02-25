import path from "path";
import { PrismaClient } from "@prisma/client";

// Prisma resolves relative URLs from the prisma/ directory; resolve the same way so app and CLI use the same DB.
const url = process.env.DATABASE_URL;
if (url?.startsWith("file:./") || url?.startsWith("file:../")) {
  const rel = url.slice(5).replace(/^\.\.?\/?/, ""); // strip "file:" and leading ./ or ../
  const projectRoot = process.cwd();
  const prismaDir = path.join(projectRoot, "prisma");
  const absolutePath = path.join(prismaDir, rel);
  process.env.DATABASE_URL = "file:" + absolutePath;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
