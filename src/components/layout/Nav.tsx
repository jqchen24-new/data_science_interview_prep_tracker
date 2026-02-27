"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { resolveProfession, getCopyForProfession } from "@/lib/profession-config";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Daily Plan" },
  { href: "/tasks", label: "Tasks" },
  { href: "/applications", label: "Applications" },
  { href: "/progress", label: "Progress" },
  { href: "/tags", label: "Tags" },
  { href: "/settings", label: "Settings" },
];

const linkBase =
  "text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const profession = resolveProfession(session?.user?.profession ?? null);
  const copy = getCopyForProfession(profession);
  const brandLabel = copy?.navBrand ?? "The Offer Lab";

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4 md:gap-6">
        <Link
          href="/dashboard"
          className="font-semibold text-neutral-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
          onClick={() => setMenuOpen(false)}
        >
          {brandLabel}
        </Link>

        {/* Desktop: inline links */}
        <div className="hidden flex-1 gap-4 md:flex">
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`${linkBase} ${
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

        {/* Mobile: hamburger + auth */}
        <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {status === "loading" ? (
            <span className="text-sm text-neutral-400">...</span>
          ) : session?.user ? (
            <>
              <span className="hidden text-sm text-neutral-600 dark:text-neutral-400 sm:inline">
                {session.user.email ?? session.user.name ?? "Signed in"}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className={`${linkBase} text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white`}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className={`${linkBase} font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white`}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
          <ul className="mx-auto max-w-4xl space-y-0 px-4 py-3">
            {links.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm ${
                      active
                        ? "font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}
