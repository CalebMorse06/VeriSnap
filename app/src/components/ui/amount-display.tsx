"use client";

import { motion } from "framer-motion";

interface AmountDisplayProps {
  drops: number;
  variant?: "default" | "large" | "inline";
  showSymbol?: boolean;
  prefix?: "+" | "-" | "";
}

export function AmountDisplay({ drops, variant = "default", showSymbol = true, prefix = "" }: AmountDisplayProps) {
  const xrp = drops / 1_000_000;
  const formatted = xrp % 1 === 0 ? xrp.toString() : xrp.toFixed(2);

  const getColorClass = () => {
    if (prefix === "+") return "text-green-600";
    if (prefix === "-") return "text-red-600";
    return "text-[var(--vs-text-primary)]";
  };

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-baseline gap-1 font-semibold ${getColorClass()}`}>
        <span>{prefix}{formatted}</span>
        {showSymbol && <span className="text-[var(--vs-text-tertiary)] text-xs font-medium">XRP</span>}
      </span>
    );
  }

  if (variant === "large") {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <p className={`text-4xl font-semibold tracking-tight ${getColorClass()}`}>
          {prefix}{formatted}
        </p>
        {showSymbol && (
          <p className="text-sm text-[var(--vs-text-tertiary)] font-medium mt-1">XRP</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-baseline gap-1 font-medium ${getColorClass()}`}>
      <span>{prefix}{formatted}</span>
      {showSymbol && <span className="text-[var(--vs-text-tertiary)] text-xs">XRP</span>}
    </div>
  );
}

/**
 * Compact XRP display for tight spaces
 */
export function XrpAmount({ drops, className = "" }: { drops: number; className?: string }) {
  const xrp = drops / 1_000_000;
  const formatted = xrp % 1 === 0 ? xrp.toString() : xrp.toFixed(2);
  
  return (
    <span className={`font-medium ${className}`}>
      {formatted} <span className="text-[var(--vs-text-tertiary)]">XRP</span>
    </span>
  );
}
