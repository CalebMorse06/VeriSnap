"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

/**
 * Demo mode banner - shows at top of page to indicate testnet
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">
            <span className="font-medium">Demo Mode</span>
            <span className="hidden sm:inline"> — Using XRPL Testnet. No real XRP transferred.</span>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 p-1"
        >
          <X className="w-4 h-4" />
        </button>
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
