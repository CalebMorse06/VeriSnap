"use client";

import { useState } from "react";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { Challenge } from "@/types/challenge";
import { motion } from "framer-motion";
import Link from "next/link";

// Demo challenge - KU Campanile
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
    stakeAmount: 10_000_000, // 10 XRP
    creatorAddress: "rDemoCreatorXRPAddress123",
    status: "FUNDED",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
];

export default function Home() {
  const [challenges] = useState<Challenge[]>(DEMO_CHALLENGES);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">VeriSnap</span>
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
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-zinc-900">Active Challenges</h1>
          <p className="text-zinc-500 mt-1">Complete challenges, earn XRP</p>
        </motion.div>

        {/* Pillars badge */}
        <div className="flex justify-center gap-2 mb-6">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            XRPL Powered
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            Pinata Verified
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            AI Judged
          </span>
        </div>

        {/* Challenge list */}
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onAccept={() => {
                window.location.href = `/challenge/${challenge.id}/accept`;
              }}
              onView={() => {
                window.location.href = `/challenge/${challenge.id}`;
              }}
            />
          ))}
        </div>

        {/* Empty state */}
        {challenges.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400">No active challenges</p>
            <Link href="/challenge/create">
              <Button className="mt-4">Create First Challenge</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
