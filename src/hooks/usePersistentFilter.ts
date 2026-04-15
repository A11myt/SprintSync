"use client";

import { useState, useEffect } from "react";
import { getCookie, setCookie } from "@/lib/cookies";

/**
 * useState that persists its value in a cookie under the given key.
 * Initialises to "" on first render (SSR-safe), then hydrates from the
 * cookie after mount so the last-used filter is restored automatically.
 */
export function usePersistentFilter(cookieKey: string) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const stored = getCookie(cookieKey);
    if (stored) setValue(stored);
  }, [cookieKey]);

  function set(next: string) {
    setValue(next);
    setCookie(cookieKey, next);
  }

  return [value, set] as const;
}
