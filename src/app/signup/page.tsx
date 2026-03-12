import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Sign Up" };

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Create an account
      </h1>
      <p className="text-center text-neutral-600 dark:text-neutral-400">
        Sign up with email to use The Offer Lab without Google.
      </p>
      <div className="max-w-md rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400">
        Your data stays private. We use it only to run your account and never
        sell or share it with third parties.{" "}
        <Link
          href="/privacy"
          className="font-medium text-neutral-900 underline dark:text-white"
        >
          Privacy policy
        </Link>
      </div>
      <SignUpForm />
    </div>
  );
}
