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
      <SignUpForm />
    </div>
  );
}
