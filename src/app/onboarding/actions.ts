"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDefaultTagsForUser } from "@/lib/tags";
import { isProfessionId } from "@/lib/profession-config";

export async function setProfessionAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  const professionId = formData.get("profession") as string;
  if (!professionId || !isProfessionId(professionId)) {
    return { error: "Please choose a track" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profession: professionId },
  });
  await ensureDefaultTagsForUser(userId, professionId);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
