"use client";

import { useEffect, useState } from "react";

export function useCapsLock() {
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === "function") {
        setCapsLock(e.getModifierState("CapsLock"));
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handler);
    };
  }, []);

  return capsLock;
}
