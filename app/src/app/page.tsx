"use client";

import { useEffect, useState } from "react";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Trophy } from "lucide-react";
import { Challenge } from "@/types/challenge";
import { motion } from "framer-motion";
import Link from "next/link";

// Demo challenges
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: "campanile-1",
    title: "Visit the KU Campanile",
    description: "Prove you're at the iconic KU Campanile tower",
    objective: "Take a photo clearly showing the KU Campanile bell tower",
    location: {
      name: "KU Campanile, Lawrence, KS",
      lat: 38.9543,
      lng: -95.2558,
    },
    stakeAmount: 20_000_000, // 20 XRP
    creatorAddress: "rDemoCreatorXRPAddress123",
    status: "FUNDED",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
];

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>(DEMO_CHALLENGES);

  useEffect(() => {
    // Load any user-created challenges from session
    const stored = sessionStorage.getItem("activeChallenge");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const userChallenge: Challenge = {
          id: parsed.id,
          title: parsed.title,
          description: parsed.description,
          objective: parsed.objective,
          location: { name: parsed.location, lat: 0, lng: 0 },
          stakeAmount: parsed.stakeAmount * 1_000_000,
          creatorAddress: "rUserWallet",
          status: "FUNDED",
          createdAt: new Date(parsed.createdAt),
          expiresAt: new Date(parsed.expiresAt),
          xrpTxHash: parsed.xrpTxHash,
        };
        setChallenges(prev => [userChallenge, ...prev]);
      } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
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
          <Link href="/challenge/create">
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-zinc-900">Live Challenges</h1>
          <p className="text-zinc-500 mt-1">Complete challenges. Prove with AI. Win XRP.</p>
        </motion.div>

        {/* Three pillars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-6 flex-wrap"
        >
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            XRPL Escrow
          </span>
          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Pinata IPFS
          </span>
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Gemini AI
          </span>
        </motion.div>

        {/* Challenge list */}
        <div className="space-y-4">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
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

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 bg-zinc-100 rounded-2xl"
        >
          <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            How VeriSnap Works
          </h3>
          <ol className="space-y-2 text-sm text-zinc-600">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Accept a challenge — XRP stake locks on XRPL</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Complete the real-world task before time expires</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>Capture live proof — uploads privately to Pinata</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span>Gemini AI verifies if you completed the challenge</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
              <span>Pass = XRP released. Fail = stake forfeited.</span>
            </li>
          </ol>
        </motion.div>
      </main>
    </div>
  );
}
