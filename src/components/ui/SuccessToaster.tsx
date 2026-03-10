"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "./Toast";
import { SUCCESS_MESSAGES } from "@/lib/success-messages";

export function SuccessToaster() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const lastSuccessRef = useRef<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    if (!success) {
      lastSuccessRef.current = null;
      return;
    }
    if (lastSuccessRef.current === success) return;
    lastSuccessRef.current = success;
    const message = SUCCESS_MESSAGES[success] ?? "Done";
    addToast(message);
  }, [searchParams, addToast]);

  return null;
}
