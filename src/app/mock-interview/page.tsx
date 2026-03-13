import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mock Interview" };

export default async function MockInterviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Mock Interview
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Upload your resume and practice with AI-generated questions. Get
          feedback after each answer.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Upload a resume (PDF, DOCX, or TXT). We’ll generate a mix of
          resume-based and behavioral questions. You’ll answer one at a time
          and receive feedback before moving to the next.
        </p>
        <Link href="/mock-interview/new" className="mt-4 inline-block">
          <Button>Start mock interview</Button>
        </Link>
      </div>
    </div>
  );
}
