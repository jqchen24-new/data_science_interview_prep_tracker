import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSqlQuestions, getSqlAttemptPassedByQuestion } from "@/lib/sql-practice";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "SQL Practice" };

export default async function SqlPracticeListPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const [questions, passedSet] = await Promise.all([
    getSqlQuestions(),
    getSqlAttemptPassedByQuestion(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          SQL Practice
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Real interview-style SQL questions. Run your query against the sample database, then submit for feedback.
        </p>
      </div>
      <Card>
        <CardTitle>Questions</CardTitle>
        {questions.length === 0 ? (
          <p className="py-6 text-center text-neutral-500 dark:text-neutral-400">
            No questions yet. Run the seed to add practice questions.
          </p>
        ) : (
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/sql-practice/${q.slug}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-4 py-3 transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
                >
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {q.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {q.difficulty && (
                      <Badge className="capitalize">{q.difficulty}</Badge>
                    )}
                    {passedSet.has(q.id) && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Solved
                      </Badge>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
