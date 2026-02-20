import { getAllTags } from "@/lib/tags";
import { Card, CardTitle } from "@/components/ui/Card";
import { TagsPageClient } from "./TagsPageClient";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Tags
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Add, edit, or remove tags. Defaults (SQL, ML, Stats, Python, Behavioral) are created when you seed the database.
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
