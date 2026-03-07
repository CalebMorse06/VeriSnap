"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Clock, Coins, Shield, Camera, ChevronLeft, Share2, User, Zap } from "lucide-react";
import { getChallenge } from "@/lib/store/challenges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Demo challenge data
const CHALLENGES: Record<string, {
  id: string;
  title: string;
  description: string;
  objective: string;
  location: { name: string; lat: number; lng: number };
  stakeAmount: number;
  durationMinutes: number;
  creatorAddress: string;
  status: string;
}> = {
  "campanile-1": {
    id: "campanile-1",
    title: "Visit the KU Campanile",
    description: "Prove you're at the iconic KU Campanile bell tower. This 120-foot tall campanile is one of the most recognizable landmarks at the University of Kansas.",
    objective: "Take a clear photo showing the KU Campanile bell tower. The tower must be clearly visible and recognizable in the image.",
    location: { name: "KU Campanile, Lawrence, KS", lat: 38.9543, lng: -95.2558 },
    stakeAmount: 20_000_000,
    durationMinutes: 20,
    creatorAddress: "rVeriSnapDemo123",
    status: "FUNDED",
  },
};

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  
  const stored = getChallenge(challengeId);
  const challenge = stored || CHALLENGES[challengeId] || CHALLENGES["campanile-1"];
  const xrpAmount = (challenge.stakeAmount / 1_000_000).toFixed(0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header image area */}
      <div className="relative h-56 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
        {/* Back button */}
        <Link href="/" className="absolute top-4 left-4 z-10">
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </Link>

        {/* Share button */}
        <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <Share2 className="w-5 h-5 text-white" />
        </button>

        {/* Challenge badge */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <Badge className="bg-green-500 text-white mb-2">Live Challenge</Badge>
            <h1 className="text-2xl font-bold text-white">{challenge.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-xs">STAKE</p>
            <p className="text-2xl font-bold text-green-400">{xrpAmount} XRP</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 -mt-4 relative z-10">
        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-zinc-900">{challenge.durationMinutes}</p>
                  <p className="text-xs text-zinc-500">Minutes</p>
                </div>
                <div>
                  <Coins className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-zinc-900">{xrpAmount}</p>
                  <p className="text-xs text-zinc-500">XRP Stake</p>
                </div>
                <div>
                  <Camera className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-zinc-900">1</p>
                  <p className="text-xs text-zinc-500">Photo Proof</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-zinc-900 mb-2">About this Challenge</h2>
              <p className="text-zinc-600 text-sm leading-relaxed">
                {challenge.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Objective */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h2 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                What You Need to Submit
              </h2>
              <p className="text-blue-800 text-sm">
                {challenge.objective}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                Location
              </h2>
              {/* Map placeholder */}
              <div className="h-32 bg-zinc-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+3b82f6(${challenge.location.lng},${challenge.location.lat})/${challenge.location.lng},${challenge.location.lat},15,0/400x200@2x?access_token=pk.placeholder`}
                  alt="Map"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class="text-zinc-500 text-sm">${challenge.location.name}</div>`;
                  }}
                />
              </div>
              <p className="text-zinc-600 text-sm">{challenge.location.name}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                How Verification Works
              </h2>
              <ol className="space-y-2 text-sm text-zinc-600">
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Your stake locks in XRPL escrow</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Proof uploads privately to Pinata IPFS</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Gemini AI verifies your submission</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>Pass = escrow released to you. Fail = forfeited.</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>

        {/* Creator info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-500">Created by</p>
                <p className="text-sm font-mono text-zinc-700 truncate">
                  {challenge.creatorAddress}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accept button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            size="lg"
            className="w-full text-lg h-14 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => router.push(`/challenge/${challengeId}/accept`)}
          >
            <Zap className="w-5 h-5" />
            Accept Challenge — Stake {xrpAmount} XRP
          </Button>
          <p className="text-center text-xs text-zinc-500 mt-3">
            By accepting, you agree to stake {xrpAmount} XRP in escrow
          </p>
        </motion.div>
      </main>
    </div>
  );
}
