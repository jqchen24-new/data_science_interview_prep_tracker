import { notFound } from "next/navigation";
import Link from "next/link";
import { getApplicationById } from "@/lib/applications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApplicationEditForm } from "../ApplicationEditForm";

export const dynamic = "force-dynamic";

export default async function ApplicationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getApplicationById(id);
  if (!app) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Edit application
        </h1>
        <Link href="/applications">
          <Button variant="ghost">Back to applications</Button>
        </Link>
      </div>

      <Card>
        <ApplicationEditForm app={app} />
      </Card>
    </div>
  );
}
