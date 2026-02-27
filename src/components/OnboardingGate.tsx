"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

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

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user) return;
    if (isAllowedWithoutProfession(pathname ?? "")) return;
    if (session.user.profession != null && session.user.profession !== "") return;
    if (isProtectedPath(pathname ?? "") || pathname === "/") {
      router.replace("/onboarding");
    }
  }, [status, session?.user?.profession, pathname, router]);

  return <>{children}</>;
}
