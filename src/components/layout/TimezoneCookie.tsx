"use client";

import { useEffect } from "react";

/** Sets tzOffset cookie (minutes, same as getTimezoneOffset()) so server can use local week boundaries. */
export function TimezoneCookie() {
  useEffect(() => {
    const offset = new Date().getTimezoneOffset();
    document.cookie = `tzOffset=${offset}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);
  return null;
}
