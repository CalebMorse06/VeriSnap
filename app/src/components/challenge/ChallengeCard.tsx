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

  // Premium status indicators - subtle, not flashy
  const statusConfig: Record<string, { label: string; dotColor: string; textColor: string }> = {
    FUNDED: { label: "Open", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
    DRAFT: { label: "Draft", dotColor: "bg-zinc-400", textColor: "text-zinc-500" },
    ACCEPTED: { label: "In Progress", dotColor: "bg-amber-500", textColor: "text-amber-700" },
    PROOF_SUBMITTED: { label: "Verifying", dotColor: "bg-amber-500", textColor: "text-amber-700" },
    VERIFYING: { label: "Verifying", dotColor: "bg-amber-500", textColor: "text-amber-700" },
    PASSED: { label: "Passed", dotColor: "bg-green-500", textColor: "text-green-700" },
    FAILED: { label: "Failed", dotColor: "bg-red-500", textColor: "text-red-700" },
    SETTLED: { label: "Settled", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
    EXPIRED: { label: "Expired", dotColor: "bg-zinc-400", textColor: "text-zinc-500" },
  };

  const status = statusConfig[challenge.status] ?? statusConfig.FUNDED;
  const stakeXrp = challenge.stakeAmount / 1_000_000;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      className="bg-white rounded-xl border border-[var(--vs-border)] overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="p-4">
        {/* Top row - status + stake */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
            <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
          </div>
          <div className="text-right">
            <span className="text-base font-semibold text-[var(--vs-text-primary)]">{stakeXrp}</span>
            <span className="text-xs text-[var(--vs-text-tertiary)] ml-1">XRP</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[var(--vs-text-primary)] mb-1 leading-tight">
          {challenge.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-[var(--vs-text-tertiary)] mb-3">
          {challenge.location?.name && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{challenge.location.name.split(",")[0]}</span>
            </div>
          )}
          {challenge.expiresAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(challenge.expiresAt)}</span>
            </div>
          )}
        </div>

        {/* Badge */}
        {challenge.xrpTxHash && (
          <div className="mb-3">
            <TrustBadge variant="escrow" size="sm" animated={false} />
          </div>
        )}

        {/* Action button */}
        {isLive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
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
            className="w-full py-2.5 px-4 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium flex items-center justify-center gap-2 border border-amber-200 transition-colors"
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
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-[var(--vs-text-secondary)] text-sm font-medium flex items-center justify-center gap-2 border border-[var(--vs-border)] transition-colors"
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
