"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, ChevronLeft, User, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getChallenge, ChallengeData } from "@/lib/store/challenges";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success && json.challenge) {
          const c = json.challenge;
          setChallenge({
            id: c.id,
            title: c.title,
            description: c.description,
            objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops,
            durationMinutes: c.duration_minutes,
            creatorAddress: c.escrow_owner || c.creator_id,
            status: c.status,
            visibility: c.visibility || "private",
            createdAt: new Date(c.created_at).getTime(),
            expiresAt: new Date(c.expires_at).getTime(),
            escrowTxHash: c.escrow_tx_hash,
            escrowSequence: c.escrow_sequence,
            escrowOwner: c.escrow_owner,
          });
          if (mounted) setLoading(false);
          return;
        }
      } catch {}

      if (mounted) {
        const stored = getChallenge(challengeId);
        if (stored) setChallenge(stored);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [challengeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)]">
        <header className="bg-white border-b border-[var(--vs-border)] p-4">
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-[var(--vs-text-primary)]">Challenge not found</h2>
          <Link href="/">
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const xrpAmount = challenge.stakeAmount / 1_000_000;

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-[var(--vs-text-primary)] truncate">{challenge.title}</h1>
            <p className="text-xs text-[var(--vs-text-tertiary)]">Challenge Details</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-[var(--vs-text-primary)]">{xrpAmount}</span>
            <span className="text-xs text-[var(--vs-text-tertiary)] ml-1">XRP</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-[var(--vs-text-secondary)] leading-relaxed">{challenge.description}</p>
        </motion.section>

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="p-3 rounded-xl bg-white border border-[var(--vs-border)] text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--vs-text-primary)]">{challenge.durationMinutes}</p>
            <p className="text-xs text-[var(--vs-text-tertiary)]">minutes</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[var(--vs-border)] text-center">
            <div className="w-5 h-5 rounded-full bg-emerald-500 mx-auto mb-1 flex items-center justify-center">
              <span className="text-white text-xs font-bold">$</span>
            </div>
            <p className="text-lg font-semibold text-[var(--vs-text-primary)]">{xrpAmount}</p>
            <p className="text-xs text-[var(--vs-text-tertiary)]">XRP stake</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[var(--vs-border)] text-center">
            <MapPin className="w-5 h-5 text-[var(--vs-text-tertiary)] mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--vs-text-primary)]">1</p>
            <p className="text-xs text-[var(--vs-text-tertiary)]">location</p>
          </div>
        </motion.section>

        {/* Objective */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">Verification Objective</p>
          <p className="text-sm text-emerald-900 leading-relaxed">{challenge.objective}</p>
        </motion.section>

        {/* Location */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 p-4 rounded-xl bg-white border border-[var(--vs-border)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[var(--vs-text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--vs-text-primary)]">Location</p>
          </div>
          <p className="text-sm text-[var(--vs-text-secondary)]">{challenge.location.name}</p>
        </motion.section>

        {/* Escrow info */}
        {challenge.escrowTxHash && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 rounded-xl bg-white border border-[var(--vs-border)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrustBadge variant="escrow" size="sm" animated={false} />
                <span className="text-sm text-[var(--vs-text-secondary)]">Escrow active</span>
              </div>
              <a
                href={`https://testnet.xrpl.org/transactions/${challenge.escrowTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View TX
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.section>
        )}

        {/* Creator */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 p-4 rounded-xl bg-white border border-[var(--vs-border)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--vs-text-tertiary)]">Created by</p>
              <p className="text-sm font-mono text-[var(--vs-text-secondary)] truncate">
                {challenge.creatorAddress}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Accept button */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            className="w-full h-12 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={() => router.push(`/challenge/${challengeId}/accept`)}
          >
            Accept Challenge
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-xs text-[var(--vs-text-tertiary)] mt-3">
            {xrpAmount} XRP will be locked in XRPL escrow
          </p>
        </motion.section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
