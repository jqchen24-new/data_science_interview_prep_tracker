"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { deleteTagAction } from "./actions";

export function TagDeleteButton({ tagId, tagName }: { tagId: string; tagName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleConfirm = async () => {
    const formData = new FormData();
    formData.set("id", tagId);
    await deleteTagAction(formData);
    addToast("Tag deleted");
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="!py-0 !px-1 text-neutral-500 hover:text-red-600"
        onClick={() => setOpen(true)}
      >
        ×
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Delete tag?"
        description={`Remove "${tagName}"? Tasks will keep their other tags.`}
        confirmLabel="Delete"
      />
    </>
  );
}
