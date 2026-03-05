import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PROFESSION_OPTIONS, resolveProfession } from "@/lib/profession-config";
import { updateProfessionAction, addDefaultTagsAction, getReminderSettings } from "./actions";
import { Card, CardTitle } from "@/components/ui/Card";
import { SettingsForm } from "./SettingsForm";
import { ReminderSettings } from "./ReminderSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  const profession = session.user.profession ?? null;
  const resolved = resolveProfession(profession);
  const currentLabel = PROFESSION_OPTIONS.find((p) => p.id === resolved)?.label ?? "Not set";
  const reminder = await getReminderSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Manage your track and preferences.
        </p>
      </div>

      <Card>
        <CardTitle>Track</CardTitle>
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          Your current track: <strong>{currentLabel}</strong>. Changing it updates how the app is labeled; your data is unchanged.
        </p>
        <SettingsForm
          professionOptions={PROFESSION_OPTIONS}
          currentProfession={profession ?? ""}
          updateAction={updateProfessionAction}
          addDefaultTagsAction={addDefaultTagsAction}
        />
      </Card>

      <Card>
        <CardTitle>Study Reminders</CardTitle>
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          Get a browser notification to remind you to study. Works when the app tab is open.
        </p>
        <ReminderSettings
          initialEnabled={reminder.enabled}
          initialTime={reminder.time ?? "09:00"}
        />
      </Card>
    </div>
  );
}
