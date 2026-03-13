import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MockInterviewUploadForm } from "./MockInterviewUploadForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Upload resume – Mock Interview" };

export default async function MockInterviewNewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <Link
          href="/mock-interview"
          className="text-sm font-medium text-neutral-600 underline dark:text-neutral-400 dark:hover:text-white"
        >
          Back to Mock Interview
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
          Upload your resume
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          We’ll use it to generate personalized and behavioral questions.
          Accepted: .pdf, .docx, .txt (max 5MB).
        </p>
      </div>

      <MockInterviewUploadForm />
    </div>
  );
}
