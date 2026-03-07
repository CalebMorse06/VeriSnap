"use client";

import { useEffect, useState } from "react";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustPillars } from "@/components/ui/trust-badge";
import { Plus, RotateCcw, Activity, Globe } from "lucide-react";
import { Challenge, ChallengeStatus } from "@/types/challenge";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getChallenges } from "@/lib/store/challenges";

function toUiChallenge(c: ReturnType<typeof getChallenges>[number]): Challenge {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    objective: c.objective,
    location: c.location,
    stakeAmount: c.stakeAmount,
    creatorAddress: c.creatorAddress,
    status: c.status as ChallengeStatus,
    createdAt: new Date(c.createdAt),
    expiresAt: new Date(c.expiresAt),
    xrpTxHash: c.escrowTxHash,
  };
}

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/challenges", { cache: "no-store" });
        const json = await res.json();
        if (mounted && res.ok && json.success && Array.isArray(json.challenges)) {
          const mapped = json.challenges.map((c: Record<string, unknown>) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops,
            creatorAddress: c.escrow_owner || c.creator_id,
            status: c.status as ChallengeStatus,
            createdAt: new Date(c.created_at as string),
            expiresAt: new Date(c.expires_at as string),
            xrpTxHash: c.escrow_tx_hash,
          } as Challenge));
          setChallenges(mapped);
        } else {
          setChallenges(getChallenges().map(toUiChallenge));
        }
      } catch {
        setChallenges(getChallenges().map(toUiChallenge));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const resetDemo = () => {
    sessionStorage.removeItem("verisnap_challenges");
    sessionStorage.removeItem("proofData");
    sessionStorage.removeItem("verificationResult");
    sessionStorage.removeItem("challengeAccepted");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header - clean, minimal */}
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">VeriSnap</h1>
              <p className="text-[10px] text-[var(--vs-text-tertiary)] font-medium -mt-0.5 tracking-wide uppercase">Challenges</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/feed">
              <Button size="sm" variant="ghost" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100">
                <Globe className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-[var(--vs-text-tertiary)] hover:text-[var(--vs-text-secondary)] hover:bg-zinc-100" 
              onClick={resetDemo}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Link href="/challenge/create">
              <Button size="sm" className="ml-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">
                <Plus className="w-4 h-4" />
                New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--vs-text-secondary)] uppercase tracking-wide">
            Active Challenges
          </h2>
          <span className="text-xs text-[var(--vs-text-tertiary)]">
            {!loading && `${challenges.length} total`}
          </span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-[var(--vs-border)] p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : challenges.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-base font-medium text-[var(--vs-text-primary)]">No active challenges</h3>
              <p className="text-[var(--vs-text-secondary)] text-sm mt-1">Create your first challenge to get started.</p>
              <Link href="/challenge/create">
                <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create Challenge
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ChallengeCard
                    challenge={challenge}
                    onAccept={() => { window.location.href = `/challenge/${challenge.id}/accept`; }}
                    onView={() => { window.location.href = `/challenge/${challenge.id}`; }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
          <p className="text-center text-xs text-[var(--vs-text-tertiary)] mt-4">
            Stake XRP • Submit proof • AI verifies • Settle on-chain
          </p>
        </div>
      </main>
    </div>
  );
}
