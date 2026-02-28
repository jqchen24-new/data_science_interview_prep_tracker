import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PROFESSION_OPTIONS } from "@/lib/profession-config";
import { setProfessionAction } from "./actions";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  if (session.user.profession) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Choose your track
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          What are you prepping for? We’ll set up default tags for you.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      )}

      <form action={setProfessionAction} className="space-y-4">
        <div className="grid gap-2">
          {PROFESSION_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <input
                type="radio"
                name="profession"
                value={option.id}
                className="h-4 w-4"
                required
              />
              <span className="font-medium text-neutral-900 dark:text-white">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
