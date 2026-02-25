/**
 * One-off script: move all tasks and applications from the placeholder user
 * ("migration-default-user") to your real user (the one you use to sign in).
 *
 * Run after you have signed in at least once with Google:
 *   npx tsx scripts/reclaim-data.ts YOUR_GOOGLE_EMAIL@example.com
 *
 * Or to reclaim by user id:
 *   npx tsx scripts/reclaim-data.ts --userId YOUR_USER_ID
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLACEHOLDER_USER_ID = "migration-default-user";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/reclaim-data.ts <your-email@example.com>");
    console.error("   or: npx tsx scripts/reclaim-data.ts --userId <your-user-id>");
    process.exit(1);
  }

  let targetUserId: string;

  if (args[0] === "--userId" && args[1]) {
    targetUserId = args[1];
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      console.error("No user found with id:", targetUserId);
      process.exit(1);
    }
    console.log("Target user:", user.email ?? user.name ?? targetUserId);
  } else {
    const email = args[0];
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error("No user found with email:", email);
      console.error("Sign in once with Google so your user exists, then run this again.");
      process.exit(1);
    }
    targetUserId = user.id;
    console.log("Target user:", user.email ?? user.name ?? user.id);
  }

  if (targetUserId === PLACEHOLDER_USER_ID) {
    console.error("Don't use the placeholder user as the target. Use your Google account email.");
    process.exit(1);
  }

  const [tasksUpdated, applicationsUpdated] = await Promise.all([
    prisma.task.updateMany({
      where: { userId: PLACEHOLDER_USER_ID },
      data: { userId: targetUserId },
    }),
    prisma.application.updateMany({
      where: { userId: PLACEHOLDER_USER_ID },
      data: { userId: targetUserId },
    }),
  ]);

  console.log("Reassigned to your user:");
  console.log("  Tasks:", tasksUpdated.count);
  console.log("  Applications:", applicationsUpdated.count);
  console.log("Done. Refresh the app to see your data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
