import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "./SignInButton";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration (missing or wrong env).",
  AccessDenied: "Access denied (e.g. you were not allowed to sign in).",
  Verification: "The sign-in link was already used or has expired.",
  Default: "Something went wrong during sign-in.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const errorCode = params.error;
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default
    : null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Sign in to DS Prep
      </h1>
      <p className="text-center text-neutral-600 dark:text-neutral-400">
        Use your Google account to access your study tracker.
      </p>
      {errorMessage && (
        <div
          role="alert"
          className="max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="font-medium">Sign-in failed</p>
          <p className="mt-1">{errorMessage}</p>
          {errorCode && (
            <p className="mt-1 text-xs opacity-80">Error code: {errorCode}</p>
          )}
        </div>
      )}
      <SignInButton />
    </div>
  );
}
