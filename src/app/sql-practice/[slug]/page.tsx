import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSqlQuestionBySlug, getSubmissionsForQuestion, getNextQuestionSlug } from "@/lib/sql-practice";
import { Button } from "@/components/ui/Button";
import { SqlPracticeEditor } from "@/components/sql-practice/SqlPracticeEditor";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const question = await getSqlQuestionBySlug(slug);
  if (!question) return { title: "SQL Practice" };
  return { title: question.title };
}

export default async function SqlQuestionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-600 dark:text-neutral-400">
          Sign in to practice SQL.
        </p>
        <Link href="/signin">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }
  const { slug } = await params;
  const question = await getSqlQuestionBySlug(slug);
  if (!question) notFound();

  const [submissions, nextSlug] = await Promise.all([
    getSubmissionsForQuestion(session.user.id, question.id),
    getNextQuestionSlug(question.order),
  ]);

  return (
    <div className="relative left-1/2 right-1/2 flex min-h-[calc(100vh-3.5rem)] w-screen min-w-0 -ml-[50vw] -mr-[50vw]">
      <SqlPracticeEditor
        questionId={question.id}
        title={question.title}
        difficulty={question.difficulty ?? undefined}
        problemStatement={question.problemStatement}
        schemaSql={question.schemaSql}
        seedSql={question.seedSql}
        expectedResult={(Array.isArray(question.expectedResult) ? question.expectedResult : []) as Record<string, unknown>[]}
        submissions={submissions}
        nextSlug={nextSlug}
      />
    </div>
  );
}
