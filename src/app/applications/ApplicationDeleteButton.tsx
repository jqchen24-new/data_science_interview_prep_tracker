"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteApplicationAction } from "./actions";

export function ApplicationDeleteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    const formData = new FormData();
    formData.set("id", id);
    await deleteApplicationAction(formData);
  };

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Delete application?"
        description={`Remove "${label}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
