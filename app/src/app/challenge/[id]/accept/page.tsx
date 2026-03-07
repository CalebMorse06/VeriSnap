"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Camera, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadge } from "@/components/ui/trust-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { getChallenge, updateChallenge, ChallengeData } from "@/lib/store/challenges";

const FALLBACK: ChallengeData = {
  id: "campanile-1",
  title: "Visit the KU Campanile",
  description: "Prove you're at the iconic KU Campanile tower",
  objective: "Take a clear photo showing the KU Campanile bell tower",
  location: { name: "KU Campanile, Lawrence, KS", lat: 0, lng: 0 },
  stakeAmount: 20_000_000,
  durationMinutes: 20,
  creatorAddress: "rDemo",
  status: "FUNDED",
  visibility: "private",
  createdAt: Date.now(),
  expiresAt: Date.now() + 86400000,
};

export default function AcceptChallengePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const challenge = getChallenge(id) || FALLBACK;

  const [accepted, setAccepted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(challenge.durationMinutes * 60);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!accepted) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [accepted]);

  const handleAccept = () => {
    setAccepted(true);
    const acceptedAt = Date.now();
    const expiresAt = acceptedAt + challenge.durationMinutes * 60 * 1000;

    sessionStorage.setItem(
      "challengeAccepted",
      JSON.stringify({ challengeId: id, acceptedAt, expiresAt })
    );
    updateChallenge(id, { status: "ACCEPTED", acceptedAt });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const xrpAmount = (challenge.stakeAmount / 1_000_000).toFixed(0);
  const progress = (timeRemaining / (challenge.durationMinutes * 60)) * 100;

  if (!accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-lg">
            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30"
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="text-xl font-bold text-white mb-2">{challenge.title}</h1>
              <p className="text-zinc-400 text-sm mb-6">{challenge.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <AmountDisplay drops={challenge.stakeAmount} variant="inline" />
                  <span className="text-emerald-400 text-sm">at stake</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-700/50">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-sm">{challenge.durationMinutes} minute limit</span>
                  </div>
                  <TrustBadge variant="escrow" size="sm" animated={false} />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-700/50 text-zinc-300">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-sm truncate">{challenge.location.name}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <div className="flex items-center gap-2 text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Timer starts immediately after accepting</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg h-14 gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleAccept}
              >
                <CheckCircle2 className="w-5 h-5" />
                Accept Challenge
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col">
      {/* Timer header */}
      <div className={`p-4 ${isExpired ? "bg-red-600" : timeRemaining < 60 ? "bg-orange-500" : "bg-zinc-800"}`}>
        <div className="max-w-sm mx-auto">
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isExpired ? "bg-red-300" : timeRemaining < 60 ? "bg-orange-300" : "bg-emerald-400"}`}
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          {/* Timer */}
          <motion.div
            animate={{ scale: timeRemaining < 60 ? [1, 1.03, 1] : 1 }}
            transition={{ repeat: timeRemaining < 60 ? Infinity : 0, duration: 1 }}
            className={`text-7xl font-mono font-bold mb-4 tracking-tight ${
              isExpired ? "text-red-500" : timeRemaining < 60 ? "text-orange-400" : "text-white"
            }`}
          >
            {formatTime(timeRemaining)}
          </motion.div>

          <p className="text-zinc-400 mb-6">
            {isExpired ? "Time's up!" : timeRemaining < 60 ? "Hurry!" : "Time remaining"}
          </p>

          <Card className={`mb-6 ${isExpired ? "bg-red-900/30 border-red-700" : "bg-zinc-800/50 border-zinc-700"}`}>
            <CardContent className="p-4">
              <h2 className="text-white font-semibold mb-2">{challenge.title}</h2>
              <p className="text-zinc-400 text-sm">{challenge.objective}</p>
            </CardContent>
          </Card>

          {!isExpired ? (
            <Button
              size="lg"
              className="w-full text-lg h-14 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30"
              onClick={() => router.push(`/challenge/${id}/capture`)}
            >
              <Camera className="w-5 h-5" />
              Capture Proof
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-red-400 font-medium">Challenge expired!</p>
              <p className="text-zinc-500 text-sm">Your stake has been forfeited</p>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push("/")}>
                Return Home
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
