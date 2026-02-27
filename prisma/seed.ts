import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TAGS = [
  { name: "SQL", slug: "sql" },
  { name: "ML", slug: "ml" },
  { name: "Stats", slug: "stats" },
  { name: "Python", slug: "python" },
  { name: "Behavioral", slug: "behavioral" },
];

async function main() {
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log("No users found; skipping tag seed. Sign up first, then run seed to add default tags for new users.");
    return;
  }
  const userId = users[0].id;
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { userId_slug: { userId, slug: tag.slug } },
      update: {},
      create: { userId, ...tag },
    });
  }
  console.log("Seeded 5 default tags for first user.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
