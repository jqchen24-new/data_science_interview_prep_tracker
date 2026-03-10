"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteTaskFormAction } from "./actions";

export function PlanTaskDeleteButton({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    const formData = new FormData();
    formData.set("taskId", taskId);
    await deleteTaskFormAction(formData);
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
        title="Delete task?"
        description="This cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
