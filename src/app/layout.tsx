import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { auth } from "@/lib/auth";
import { resolveProfession, getCopyForProfession } from "@/lib/profession-config";
import { Nav } from "@/components/layout/Nav";
import { PageContainer } from "@/components/layout/PageContainer";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { OnboardingGate } from "@/components/OnboardingGate";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const profession = resolveProfession(session?.user?.profession ?? null);
  const copy = getCopyForProfession(profession);
  return {
    title: {
      default: "The Offer Lab",
      template: "The Offer Lab - %s",
    },
    description: copy.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SessionProvider session={session}>
          <OnboardingGate>
            <Nav />
            <div className="flex min-h-screen flex-col">
              <PageContainer className="flex-1">{children}</PageContainer>
              <Footer />
            </div>
          </OnboardingGate>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
