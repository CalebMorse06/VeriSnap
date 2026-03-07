"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Coins } from "lucide-react";
import { Challenge, ChallengeStatus } from "@/types/challenge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const statusConfig: Record<ChallengeStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-500" },
  FUNDED: { label: "Live", color: "bg-green-500" },
  ACCEPTED: { label: "In Progress", color: "bg-blue-500" },
  PROOF_SUBMITTED: { label: "Awaiting Verification", color: "bg-yellow-500" },
  VERIFYING: { label: "Verifying...", color: "bg-purple-500" },
  PASSED: { label: "Passed ✓", color: "bg-emerald-500" },
  FAILED: { label: "Failed ✗", color: "bg-red-500" },
  SETTLED: { label: "Settled", color: "bg-gray-600" },
  EXPIRED: { label: "Expired", color: "bg-gray-400" },
};

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept?: () => void;
  onView?: () => void;
}

export function ChallengeCard({ challenge, onAccept, onView }: ChallengeCardProps) {
  const status = statusConfig[challenge.status];
  const xrpAmount = (challenge.stakeAmount / 1_000_000).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onView}>
        <CardContent className="p-0">
          {/* Header with status */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{challenge.description}</p>
              </div>
              <Badge className={cn("text-white", status.color)}>
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            {challenge.location && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <MapPin className="w-4 h-4" />
                <span>{challenge.location.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Coins className="w-4 h-4" />
              <span className="font-medium text-zinc-900">{xrpAmount} XRP</span>
              <span className="text-zinc-400">stake</span>
            </div>

            {challenge.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4" />
                <span>Expires {new Date(challenge.expiresAt).toLocaleDateString()}</span>
              </div>
            )}

            {/* Action button */}
            {challenge.status === "FUNDED" && onAccept && (
              <Button 
                className="w-full mt-4" 
                onClick={(e) => { e.stopPropagation(); onAccept(); }}
              >
                Accept Challenge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
