"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Daily Plan" },
  { href: "/tasks", label: "Tasks" },
  { href: "/applications", label: "Applications" },
  { href: "/progress", label: "Progress" },
  { href: "/tags", label: "Tags" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4">
        <Link
          href="/dashboard"
          className="font-semibold text-neutral-900 dark:text-white"
        >
          DS Prep
        </Link>
        <div className="flex flex-1 gap-4">
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm ${
                  active
                    ? "font-semibold text-neutral-900 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-sm text-neutral-400">...</span>
          ) : session?.user ? (
            <>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {session.user.email ?? session.user.name ?? "Signed in"}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
