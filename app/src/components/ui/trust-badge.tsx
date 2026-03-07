"use client";

import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle2, Coins, Database, Brain } from "lucide-react";

type BadgeVariant = "xrpl" | "pinata" | "gemini" | "escrow" | "verified" | "private";

const config: Record<BadgeVariant, { icon: typeof Shield; label: string; bg: string; text: string; glow: string }> = {
  xrpl: { icon: Coins, label: "XRPL Secured", bg: "bg-emerald-500", text: "text-white", glow: "shadow-emerald-500/30" },
  pinata: { icon: Database, label: "IPFS Stored", bg: "bg-purple-500", text: "text-white", glow: "shadow-purple-500/30" },
  gemini: { icon: Brain, label: "AI Verified", bg: "bg-blue-500", text: "text-white", glow: "shadow-blue-500/30" },
  escrow: { icon: Lock, label: "Escrow Locked", bg: "bg-amber-500", text: "text-white", glow: "shadow-amber-500/30" },
  verified: { icon: CheckCircle2, label: "Verified", bg: "bg-green-500", text: "text-white", glow: "shadow-green-500/30" },
  private: { icon: Shield, label: "Private", bg: "bg-zinc-700", text: "text-white", glow: "shadow-zinc-500/20" },
};

interface TrustBadgeProps {
  variant: BadgeVariant;
  size?: "sm" | "md";
  animated?: boolean;
}

export function TrustBadge({ variant, size = "sm", animated = true }: TrustBadgeProps) {
  const { icon: Icon, label, bg, text, glow } = config[variant];

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", stiffness: 400, damping: 20 } }
    : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={`inline-flex items-center gap-1.5 ${size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"} rounded-full font-medium ${bg} ${text} shadow-lg ${glow}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      <span>{label}</span>
    </Wrapper>
  );
}

export function TrustPillars({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <TrustBadge variant="xrpl" size={size} />
      <TrustBadge variant="pinata" size={size} />
      <TrustBadge variant="gemini" size={size} />
    </div>
  );
}
