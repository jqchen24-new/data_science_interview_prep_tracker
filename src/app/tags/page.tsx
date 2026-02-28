import { auth } from "@/lib/auth";
import { getAllTags } from "@/lib/tags";
import { Card, CardTitle } from "@/components/ui/Card";
import { TagsPageClient } from "./TagsPageClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tags" };

export default async function TagsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const tags = await getAllTags(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Tags
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Add, edit, or remove tags. Each user has their own tags.
        </p>
      </div>

      <Card>
        <CardTitle>Add custom tag</CardTitle>
        <TagsPageClient tags={tags} />
      </Card>

      <Card>
        <CardTitle>All tags</CardTitle>
        <TagsPageClient tags={tags} showList />
      </Card>
    </div>
  );
}
