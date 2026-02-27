"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDefaultTagsForUser } from "@/lib/tags";
import { isProfessionId } from "@/lib/profession-config";

export async function setProfessionAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  const professionId = formData.get("profession") as string;
  if (!professionId || !isProfessionId(professionId)) {
    redirect("/onboarding?error=" + encodeURIComponent("Please choose a track"));
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profession: professionId },
  });

  try {
    await ensureDefaultTagsForUser(userId, professionId);
  } catch (e) {
    console.error("[onboarding] ensureDefaultTagsForUser failed:", e);
    // Still redirect; user can add tags in Settings
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
