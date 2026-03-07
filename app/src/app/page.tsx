"use client";

import { useEffect, useState } from "react";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Trophy, RotateCcw } from "lucide-react";
import { Challenge, ChallengeStatus } from "@/types/challenge";
import { motion } from "framer-motion";
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

  useEffect(() => {
    setChallenges(getChallenges().map(toUiChallenge));
  }, []);

  const resetDemo = () => {
    sessionStorage.removeItem("verisnap_challenges");
    sessionStorage.removeItem("proofData");
    sessionStorage.removeItem("verificationResult");
    sessionStorage.removeItem("challengeAccepted");
    setChallenges(getChallenges().map(toUiChallenge));
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">VeriSnap</span>
              <span className="text-xs text-zinc-400 block -mt-1">XRPL Challenges</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={resetDemo}>
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Link href="/challenge/create">
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Live Challenges</h1>
          <p className="text-zinc-500 mt-1">Complete challenges. Prove with AI. Win XRP.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex justify-center gap-2 mb-6 flex-wrap">
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">XRPL Escrow</span>
          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Pinata IPFS</span>
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Gemini AI</span>
        </motion.div>

        <div className="space-y-4">
          {challenges.map((challenge, index) => (
            <motion.div key={challenge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.1 }}>
              <ChallengeCard
                challenge={challenge}
                onAccept={() => {
                  window.location.href = `/challenge/${challenge.id}/accept`;
                }}
                onView={() => {
                  window.location.href = `/challenge/${challenge.id}`;
                }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 p-4 bg-zinc-100 rounded-2xl">
          <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            How VeriSnap Works
          </h3>
          <ol className="space-y-2 text-sm text-zinc-600">
            <li>1) Accept challenge → stake locks in XRPL escrow</li>
            <li>2) Complete task before timer expires</li>
            <li>3) Submit live proof photo to private IPFS</li>
            <li>4) Gemini AI verifies pass/fail</li>
            <li>5) XRPL escrow settles outcome</li>
          </ol>
        </motion.div>
      </main>
    </div>
  );
}
