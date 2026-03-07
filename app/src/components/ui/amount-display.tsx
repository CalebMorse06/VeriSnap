"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";

interface AmountDisplayProps {
  drops: number;
  variant?: "default" | "large" | "inline";
  showIcon?: boolean;
  prefix?: "+" | "-" | "";
}

export function AmountDisplay({ drops, variant = "default", showIcon = true, prefix = "" }: AmountDisplayProps) {
  const xrp = (drops / 1_000_000).toFixed(2);

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold">
        {showIcon && <Coins className="w-3.5 h-3.5 text-emerald-500" />}
        <span className={prefix === "+" ? "text-green-600" : prefix === "-" ? "text-red-600" : "text-zinc-900"}>
          {prefix}{xrp} XRP
        </span>
      </span>
    );
  }

  if (variant === "large") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-3"
      >
        {showIcon && (
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Coins className="w-6 h-6 text-emerald-600" />
          </div>
        )}
        <div>
          <p className={`text-3xl font-bold ${prefix === "+" ? "text-green-600" : prefix === "-" ? "text-red-600" : "text-zinc-900"}`}>
            {prefix}{xrp} XRP
          </p>
          <p className="text-xs text-zinc-500 font-medium">XRPL Testnet</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showIcon && <Coins className="w-4 h-4 text-emerald-500" />}
      <span className={`font-semibold ${prefix === "+" ? "text-green-600" : prefix === "-" ? "text-red-600" : "text-zinc-900"}`}>
        {prefix}{xrp} XRP
      </span>
    </div>
  );
}
