import { prisma } from "./db";

export async function getAllTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createTag(name: string) {
  const slug = slugFromName(name);
  if (!slug) throw new Error("Invalid tag name");
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) throw new Error("Tag already exists");
  return prisma.tag.create({ data: { name: name.trim(), slug } });
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function updateTag(id: string, name: string) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new Error("Tag not found");
  const slug = slugFromName(name);
  if (!slug) throw new Error("Invalid tag name");
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing && existing.id !== id) throw new Error("A tag with that name already exists");
  return prisma.tag.update({
    where: { id },
    data: { name: name.trim(), slug },
  });
}

export async function deleteTag(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new Error("Tag not found");
  await prisma.taskTag.deleteMany({ where: { tagId: id } });
  return prisma.tag.delete({ where: { id } });
}
