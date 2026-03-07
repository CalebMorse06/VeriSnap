"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Coins, Clock, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Demo data - in production this would come from API/state
const DEMO_CHALLENGE = {
  id: "campanile-1",
  title: "Visit the KU Campanile",
  description: "Prove you're at the iconic KU Campanile tower on the University of Kansas campus.",
  objective: "Take a clear photo showing the KU Campanile bell tower. The tower must be clearly visible in the frame.",
  location: {
    name: "KU Campanile, Lawrence, KS",
    lat: 38.9543,
    lng: -95.2558,
  },
  stakeAmount: 10_000_000,
  creatorAddress: "rDemoCreatorXRPAddress123",
  status: "FUNDED" as const,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  xrpTxHash: "ABC123DEF456...",
};

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challenge = DEMO_CHALLENGE; // In production: fetch by params.id

  const xrpAmount = (challenge.stakeAmount / 1_000_000).toFixed(2);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">Challenge Details</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Badge className="bg-green-500 text-white">Live</Badge>
                <span className="text-sm text-zinc-500">ID: {params.id}</span>
              </div>

              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {challenge.title}
              </h1>
              <p className="text-zinc-600">{challenge.description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Objective */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Objective
              </h2>
              <p className="text-zinc-900">{challenge.objective}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Stake Amount</p>
                  <p className="font-semibold text-zinc-900">{xrpAmount} XRP</p>
                </div>
              </div>

              {challenge.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Location</p>
                    <p className="font-semibold text-zinc-900">{challenge.location.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Expires</p>
                  <p className="font-semibold text-zinc-900">
                    {challenge.expiresAt?.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* XRPL Transaction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">XRPL Transaction</p>
                  <p className="font-mono text-sm mt-1">{challenge.xrpTxHash}</p>
                </div>
                <a 
                  href={`https://testnet.xrpl.org/transactions/${challenge.xrpTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-zinc-800 rounded-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accept button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href={`/challenge/${params.id}/capture`}>
            <Button size="lg" className="w-full text-lg py-6">
              Accept Challenge
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
