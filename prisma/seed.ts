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
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log("Seeded 5 default tags.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
