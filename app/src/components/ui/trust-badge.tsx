"use client";

import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle2, Database, Cpu, Eye, EyeOff } from "lucide-react";

type BadgeVariant = "xrpl" | "pinata" | "gemini" | "escrow" | "verified" | "private" | "pending";

/**
 * Premium, restrained badge styling
 * - Subtle backgrounds, not loud fills
 * - Text-based indicators, not flashy icons
 * - Consistent with light-mode premium aesthetic
 */
const config: Record<BadgeVariant, { 
  icon: typeof Shield; 
  label: string; 
  bg: string; 
  text: string; 
  border: string;
}> = {
  xrpl: { 
    icon: Database, 
    label: "XRPL", 
    bg: "bg-emerald-50", 
    text: "text-emerald-700", 
    border: "border-emerald-200" 
  },
  pinata: { 
    icon: Lock, 
    label: "IPFS", 
    bg: "bg-zinc-50", 
    text: "text-zinc-600", 
    border: "border-zinc-200" 
  },
  gemini: { 
    icon: Cpu, 
    label: "AI", 
    bg: "bg-zinc-50", 
    text: "text-zinc-600", 
    border: "border-zinc-200" 
  },
  escrow: { 
    icon: Lock, 
    label: "Escrowed", 
    bg: "bg-amber-50", 
    text: "text-amber-700", 
    border: "border-amber-200" 
  },
  verified: { 
    icon: CheckCircle2, 
    label: "Verified", 
    bg: "bg-green-50", 
    text: "text-green-700", 
    border: "border-green-200" 
  },
  private: { 
    icon: EyeOff, 
    label: "Private", 
    bg: "bg-zinc-50", 
    text: "text-zinc-500", 
    border: "border-zinc-200" 
  },
  pending: { 
    icon: Eye, 
    label: "Pending", 
    bg: "bg-amber-50", 
    text: "text-amber-600", 
    border: "border-amber-200" 
  },
};

interface TrustBadgeProps {
  variant: BadgeVariant;
  size?: "sm" | "md";
  animated?: boolean;
  showIcon?: boolean;
}

export function TrustBadge({ variant, size = "sm", animated = true, showIcon = true }: TrustBadgeProps) {
  const { icon: Icon, label, bg, text, border } = config[variant];

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? { 
        initial: { scale: 0.95, opacity: 0 }, 
        animate: { scale: 1, opacity: 1 }, 
        transition: { type: "spring", stiffness: 400, damping: 25 } 
      }
    : {};

  const sizeClasses = size === "sm" 
    ? "px-2 py-0.5 text-xs gap-1" 
    : "px-2.5 py-1 text-sm gap-1.5";

  return (
    <Wrapper
      {...(wrapperProps as object)}
      className={`inline-flex items-center ${sizeClasses} rounded-md font-medium ${bg} ${text} border ${border}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{label}</span>
    </Wrapper>
  );
}

/**
 * Trust pillars - subtle footer indicator
 */
export function TrustPillars({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-zinc-400">
      <span className="flex items-center gap-1">
        <Database className="w-3 h-3" />
        XRPL
      </span>
      <span className="text-zinc-300">•</span>
      <span className="flex items-center gap-1">
        <Lock className="w-3 h-3" />
        IPFS
      </span>
      <span className="text-zinc-300">•</span>
      <span className="flex items-center gap-1">
        <Cpu className="w-3 h-3" />
        AI
      </span>
    </div>
  );
}

/**
 * Inline verification status indicator
 */
export function VerificationStatus({ passed, confidence }: { passed: boolean; confidence?: number }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
      passed 
        ? "bg-green-50 text-green-700 border border-green-200" 
        : "bg-red-50 text-red-700 border border-red-200"
    }`}>
      <CheckCircle2 className="w-3 h-3" />
      <span>{passed ? "Passed" : "Failed"}</span>
      {confidence !== undefined && (
        <span className="text-zinc-400 font-normal">({confidence}%)</span>
      )}
    </div>
  );
}
