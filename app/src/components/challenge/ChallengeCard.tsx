"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight, Zap, Lock } from "lucide-react";
import { Challenge } from "@/types/challenge";
import { AmountDisplay } from "@/components/ui/amount-display";
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

  const statusConfig: Record<string, { label: string; color: string }> = {
    FUNDED: { label: "Live", color: "bg-green-500" },
    DRAFT: { label: "Draft", color: "bg-zinc-400" },
    ACCEPTED: { label: "Active", color: "bg-blue-500" },
    PROOF_SUBMITTED: { label: "Verifying", color: "bg-purple-500" },
    VERIFYING: { label: "Verifying", color: "bg-purple-500" },
    PASSED: { label: "Passed", color: "bg-green-500" },
    FAILED: { label: "Failed", color: "bg-red-500" },
    SETTLED: { label: "Settled", color: "bg-emerald-500" },
    EXPIRED: { label: "Expired", color: "bg-zinc-500" },
  };

  const status = statusConfig[challenge.status] ?? statusConfig.FUNDED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden"
    >
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
              <span className="text-xs text-zinc-400 font-medium">{status.label}</span>
            </div>
            <h3 className="text-lg font-bold text-white truncate">{challenge.title}</h3>
            <p className="text-sm text-zinc-400 mt-0.5 line-clamp-1">{challenge.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <AmountDisplay drops={challenge.stakeAmount} variant="inline" />
          </div>
        </div>

        {/* Escrow badge */}
        <div className="mt-3 flex items-center gap-2">
          <TrustBadge variant="escrow" size="sm" animated={false} />
          {challenge.xrpTxHash && (
            <span className="text-xs text-zinc-500 font-mono truncate max-w-[120px]">
              {challenge.xrpTxHash.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center gap-4 text-sm text-zinc-600 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span className="truncate max-w-[140px]">{challenge.location?.name?.split(",")[0] ?? "Location TBD"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>
              {challenge.expiresAt
                ? new Date(challenge.expiresAt).toLocaleDateString()
                : "No expiry"}
            </span>
          </div>
        </div>

        {/* Action */}
        {isLive && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Zap className="w-4 h-4" />
            Accept Challenge
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}

        {isActive && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Continue Challenge
          </motion.button>
        )}

        {isComplete && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="w-full py-3 px-4 rounded-xl bg-zinc-100 text-zinc-700 font-semibold flex items-center justify-center gap-2"
          >
            View Result
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
