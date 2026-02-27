import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed no longer creates default tags; they are created when the user
 * chooses a profession during onboarding (or via Settings > Add default tags).
 */
async function main() {
  console.log("Seed complete. Default tags are created at onboarding.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
