import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { resolveProfession, getCopyForProfession } from "@/lib/profession-config";
import { Nav } from "@/components/layout/Nav";
import { PageContainer } from "@/components/layout/PageContainer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { OnboardingGate } from "@/components/OnboardingGate";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const profession = resolveProfession(session?.user?.profession ?? null);
  const copy = getCopyForProfession(profession);
  return {
    title: `Prep Tracker – ${copy.titleSuffix}`,
    description: copy.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <OnboardingGate>
            <Nav />
            <PageContainer>{children}</PageContainer>
          </OnboardingGate>
        </SessionProvider>
      </body>
    </html>
  );
}
