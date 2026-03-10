import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveProfession, getCopyForProfession } from "@/lib/profession-config";
import { Nav } from "@/components/layout/Nav";
import { PageContainer } from "@/components/layout/PageContainer";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SuccessToaster } from "@/components/ui/SuccessToaster";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ReminderScheduler } from "@/components/layout/ReminderScheduler";
import { TimezoneCookie } from "@/components/layout/TimezoneCookie";

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

  let reminderEnabled = false;
  let reminderTime: string | null = null;
  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { reminderEnabled: true, reminderTime: true },
      });
      reminderEnabled = user?.reminderEnabled ?? false;
      reminderTime = user?.reminderTime ?? null;
    } catch {
      // ignore — reminder is best-effort
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SessionProvider session={session}>
          <ToastProvider>
            <OnboardingGate>
              <Nav />
              <div className="flex min-h-screen flex-col">
                <PageContainer className="flex-1">{children}</PageContainer>
                <Footer />
              </div>
            </OnboardingGate>
            <SuccessToaster />
          </ToastProvider>
        </SessionProvider>
        <ReminderScheduler enabled={reminderEnabled} time={reminderTime} />
        <TimezoneCookie />
        <Analytics />
      </body>
    </html>
  );
}
