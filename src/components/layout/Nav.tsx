"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { resolveProfession, getCopyForProfession } from "@/lib/profession-config";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Daily Plan" },
  { href: "/tasks", label: "Tasks" },
  { href: "/applications", label: "Applications" },
  { href: "/sql-practice", label: "SQL Practice" },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const profession = resolveProfession(session?.user?.profession ?? null);
  const copy = getCopyForProfession(profession);
  const brandLabel = copy?.navBrand ?? "The Offer Lab";

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [userMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 font-semibold text-neutral-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
          onClick={() => setMenuOpen(false)}
        >
          {brandLabel}
        </Link>

        {/* Desktop: nav links with clear active state; min-w-0 allows shrink + scroll when needed */}
        <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`${linkBase} whitespace-nowrap px-2.5 py-2 -mb-px border-b-2 transition-colors ${
                  active
                    ? "border-neutral-900 font-medium text-neutral-900 dark:border-white dark:text-white"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-white dark:hover:border-neutral-600"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: user menu (desktop dropdown) + mobile hamburger */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden h-6 w-px bg-neutral-200 dark:bg-neutral-700 md:block" aria-hidden />
          <div className="flex items-center gap-2 md:gap-3">
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
              <div className="relative" ref={userMenuRef}>
                {/* Desktop: dropdown trigger */}
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="hidden md:flex items-center gap-1.5 rounded-md py-2 pl-2 pr-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <span className="max-w-[140px] truncate">
                    {session.user.email ?? session.user.name ?? "Account"}
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                      Signed in as
                    </div>
                    <div className="truncate px-3 py-1.5 text-sm text-neutral-900 dark:text-white">
                      {session.user.email ?? session.user.name ?? "—"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/signin" });
                      }}
                      className={`${linkBase} w-full px-3 py-2 text-left text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white`}
                    >
                      Sign out
                    </button>
                  </div>
                )}
                {/* Mobile: inline email + sign out */}
                <div className="flex items-center gap-2 md:hidden">
                  <span className="max-w-[120px] truncate text-sm text-neutral-600 dark:text-neutral-400 sm:max-w-[160px]">
                    {session.user.email ?? session.user.name ?? "Signed in"}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className={`${linkBase} text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white`}
                  >
                    Sign out
                  </button>
                </div>
              </div>
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
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
          <ul className="mx-auto max-w-5xl space-y-0 px-4 py-3">
            {links.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-md px-3 py-2.5 text-sm ${
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
