"use client";

import { useEffect, useState } from "react";

type SyncState = "idle" | "ok" | "failed";

export function SyncIndicator() {
  const [state, setState] = useState<SyncState>("idle");

  useEffect(() => {
    function handleSync(e: Event) {
      const detail = (e as CustomEvent).detail;
      setState(detail?.ok ? "ok" : "failed");
      if (!detail?.ok) {
        const timer = setTimeout(() => setState("idle"), 30000);
        return () => clearTimeout(timer);
      }
    }
    window.addEventListener("verisnap:sync", handleSync);
    return () => window.removeEventListener("verisnap:sync", handleSync);
  }, []);

  if (state === "idle") return null;

  return (
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        state === "ok" ? "bg-emerald-400" : "bg-red-400 animate-pulse"
      }`}
      title={state === "ok" ? "Data synced" : "Sync failed"}
    />
  );
}
