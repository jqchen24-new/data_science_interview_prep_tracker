"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, getSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const PROTECTED_PATHS = ["/dashboard", "/plan", "/tasks", "/applications", "/progress", "/tags", "/settings"];
const ALLOWED_WITHOUT_PROFESSION = ["/onboarding", "/signin", "/signup", "/settings"];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAllowedWithoutProfession(pathname: string): boolean {
  return ALLOWED_WITHOUT_PROFESSION.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (isAllowedWithoutProfession(pathname ?? "")) {
      hasRedirected.current = false;
      return;
    }
    const prof = session.user?.profession;
    if (prof != null && prof !== "") return;
    if (!isProtectedPath(pathname ?? "") && pathname !== "/") return;
    if (hasRedirected.current) return;

    let cancelled = false;
    (async () => {
      try {
        const fresh = await getSession();
        if (cancelled) return;
        if (fresh?.user?.profession != null && fresh.user.profession !== "") return;
      } catch {
        // ignore
      }
      if (cancelled) return;
      hasRedirected.current = true;
      router.replace("/onboarding");
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.profession, pathname, router]);

  return <>{children}</>;
}
