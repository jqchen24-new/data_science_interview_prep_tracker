"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SuggestQuestionModal } from "./SuggestQuestionModal";

export function SuggestQuestionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Suggest a Question
        </span>
      </Button>
      <SuggestQuestionModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
