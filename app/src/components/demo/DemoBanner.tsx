"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { SyncIndicator } from "@/components/status/SyncIndicator";

/**
 * Professional testnet indicator bar
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-xs font-medium">
            XRPL Testnet
            <span className="hidden sm:inline text-zinc-400 font-normal"> — Real transactions, test currency</span>
          </p>
          <SyncIndicator />
        </div>
        <div className="flex items-center gap-2">
          <WalletButton />
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Testnet indicator badge - compact version
 */
export function TestnetBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Testnet
    </span>
  );
}
