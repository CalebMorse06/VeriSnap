"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight, ArrowRight } from "lucide-react";
import { Challenge } from "@/types/challenge";
import { TrustBadge } from "@/components/ui/trust-badge";

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept: () => void;
  onView: () => void;
}

export function ChallengeCard({ challenge, onAccept, onView }: ChallengeCardProps) {
  const isLive = challenge.status === "FUNDED" || challenge.status === "DRAFT";
  const isActive = challenge.status === "ACCEPTED" || challenge.status === "PROOF_SUBMITTED" || challenge.status === "VERIFYING";
  const isComplete = challenge.status === "PASSED" || challenge.status === "FAILED" || challenge.status === "SETTLED";

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    FUNDED: { label: "Open", bg: "bg-emerald-100", text: "text-emerald-700" },
    DRAFT: { label: "Draft", bg: "bg-zinc-100", text: "text-zinc-600" },
    ACCEPTED: { label: "In Progress", bg: "bg-amber-100", text: "text-amber-700" },
    PROOF_SUBMITTED: { label: "Verifying", bg: "bg-amber-100", text: "text-amber-700" },
    VERIFYING: { label: "Verifying", bg: "bg-amber-100", text: "text-amber-700" },
    PASSED: { label: "Passed", bg: "bg-green-100", text: "text-green-700" },
    FAILED: { label: "Failed", bg: "bg-red-100", text: "text-red-700" },
    SETTLED: { label: "Settled", bg: "bg-emerald-100", text: "text-emerald-700" },
    EXPIRED: { label: "Expired", bg: "bg-zinc-100", text: "text-zinc-600" },
  };

  const status = statusConfig[challenge.status] ?? statusConfig.FUNDED;
  const stakeXrp = challenge.stakeAmount / 1_000_000;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      className="bg-white rounded-2xl border border-[var(--vs-border)] overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div className="p-5">
        {/* Top row - title + badge */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-[var(--vs-text-primary)] leading-tight flex-1 min-w-0 truncate tracking-tight">
            {challenge.title}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap tracking-wide ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Middle - stake + timer */}
        <div className="flex items-baseline gap-3 mb-2">
          <div>
            <span className="text-xl font-semibold text-[var(--vs-text-primary)]">{stakeXrp}</span>
            <span className="text-sm text-[var(--vs-text-tertiary)] ml-1">XRP</span>
          </div>
          {challenge.expiresAt && (
            <span className="flex items-center gap-1 text-xs text-[var(--vs-text-tertiary)]">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(challenge.expiresAt)}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-[var(--vs-text-tertiary)] mb-3">
          {challenge.location?.name && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{challenge.location.name.split(",")[0]}</span>
            </div>
          )}
          {challenge.xrpTxHash && (
            <TrustBadge variant="escrow" size="sm" animated={false} />
          )}
        </div>

        {/* Action button */}
        {isLive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            Accept Challenge
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold flex items-center justify-center gap-2 border border-amber-200 transition-colors"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {isComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="w-full py-3 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-[var(--vs-text-secondary)] text-sm font-semibold flex items-center justify-center gap-2 border border-[var(--vs-border)] transition-colors"
          >
            View Result
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m left`;
}
