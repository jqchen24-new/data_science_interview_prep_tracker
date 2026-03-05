"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function SignInForm() {
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    await signIn("credentials", {
      email: (formData.get("email") as string)?.trim(),
      password: formData.get("password") as string,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        Sign in with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            or
          </span>
        </div>
      </div>

      <form
        onSubmit={handleCredentialsSubmit}
        className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {loading ? "Signing in…" : "Sign in with email"}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        No account?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline dark:text-white">
          Create one
        </Link>
      </p>
    </div>
  );
}
