"use client";

import { useEffect, useState } from "react";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustPillars } from "@/components/ui/trust-badge";
import { Plus, Zap, RotateCcw, Sparkles, Globe } from "lucide-react";
import { Challenge, ChallengeStatus } from "@/types/challenge";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getChallenges } from "@/lib/store/challenges";

function toUiChallenge(c: any): Challenge {
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
          const mapped = json.challenges.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops,
            creatorAddress: c.escrow_owner || c.creator_id,
            status: c.status as ChallengeStatus,
            createdAt: new Date(c.created_at),
            expiresAt: new Date(c.expires_at),
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
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">VeriSnap</h1>
              <p className="text-[10px] text-zinc-500 font-medium -mt-0.5">XRPL • Pinata • Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/feed">
              <Button size="sm" variant="ghost" className="gap-1 text-zinc-500">
                <Globe className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button size="sm" variant="ghost" className="gap-1 text-zinc-500" onClick={resetDemo}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Link href="/challenge/create">
              <Button size="sm" className="gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-bold text-zinc-900">Live Challenges</h2>
          <p className="text-zinc-500 mt-1 text-sm">Stake XRP. Prove with AI. Settle on-chain.</p>
        </motion.div>

        {/* Trust pillars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <TrustPillars size="sm" />
        </motion.div>

        {/* Loading skeleton */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
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
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-700">No challenges yet</h3>
              <p className="text-zinc-500 text-sm mt-1">Create your first challenge to get started</p>
              <Link href="/challenge/create">
                <Button className="mt-4">Create Challenge</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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

        {/* How it works */}
        {!loading && challenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-5 bg-white rounded-2xl border border-zinc-100"
          >
            <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">?</span>
              How It Works
            </h3>
            <ol className="space-y-3 text-sm">
              {[
                { step: "1", text: "Accept challenge → XRP locks in XRPL escrow", color: "emerald" },
                { step: "2", text: "Complete task before timer expires", color: "orange" },
                { step: "3", text: "Capture proof → uploads privately to Pinata", color: "purple" },
                { step: "4", text: "Gemini AI verifies your submission", color: "blue" },
                { step: "5", text: "Pass = escrow released. Fail = forfeited.", color: "zinc" },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className={`w-6 h-6 rounded-full bg-${item.color}-100 text-${item.color}-700 flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {item.step}
                  </span>
                  <span className="text-zinc-600">{item.text}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </main>
    </div>
  );
}
