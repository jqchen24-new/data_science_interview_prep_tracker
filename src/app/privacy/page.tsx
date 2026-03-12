import Link from "next/link";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Privacy
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Plain English: what we collect, why, and what we never do.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          What we collect
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300">
          We store what you need to use the app: your account info (email and
          name, and a hashed password if you sign up with email), your tasks,
          study time, tags, job applications, and preferences (like your track and
          reminder settings). If you sign in with Google, we only receive your
          email and name from Google—we don’t get access to your calendar, Drive,
          or anything else.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Why we use it
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300">
          We use this data to run your account: to show your dashboard, save
          your tasks and applications, and personalize things like your track
          and default tags. We may use anonymized, aggregated usage data (e.g.
          site traffic) to improve the product. We do not use your personal data
          for advertising.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          What we never do
        </h2>
        <ul className="list-inside list-disc space-y-1 text-neutral-700 dark:text-neutral-300">
          <li>We don’t sell your data.</li>
          <li>We don’t share your data with third parties for advertising or marketing.</li>
          <li>We don’t use your tasks, applications, or study data for anything other than providing the app to you.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Google Sign-In
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300">
          When you choose “Sign in with Google,” we only request the minimum
          needed to create or identify your account: your email address and
          name. We do not request access to your Gmail, calendar, or any other
          Google data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Questions
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300">
          If you have questions about your data or this policy, contact us at{" "}
          {process.env.CONTACT_EMAIL ? (
            <a
              href={`mailto:${process.env.CONTACT_EMAIL}`}
              className="font-medium text-neutral-900 underline dark:text-white"
            >
              {process.env.CONTACT_EMAIL}
            </a>
          ) : (
            "the contact email listed on this site"
          )}
          .
        </p>
      </section>

      <p className="pt-4">
        <Link
          href="/"
          className="text-sm font-medium text-neutral-600 underline dark:text-neutral-400 dark:hover:text-white"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
