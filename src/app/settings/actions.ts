"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDefaultTagsForUser } from "@/lib/tags";
import { isProfessionId } from "@/lib/profession-config";

export async function updateProfessionAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "You must be signed in" };

  const professionId = (formData.get("profession") as string)?.trim() ?? "";
  if (professionId !== "" && !isProfessionId(professionId)) {
    return { error: "Please choose a valid track" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profession: professionId === "" ? null : professionId },
  });

  revalidatePath("/", "layout");
  return { error: null };
}

export async function addDefaultTagsAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "You must be signed in" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profession: true },
  });
  const profession = user?.profession;
  if (!profession || !isProfessionId(profession)) {
    return { error: "Set your track first, then add default tags" };
  }

  await ensureDefaultTagsForUser(userId, profession);
  revalidatePath("/tags");
  revalidatePath("/plan");
  revalidatePath("/tasks");
  return { error: null };
}
