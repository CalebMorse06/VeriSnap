"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Coins, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Demo challenge
const CHALLENGE = {
  id: "campanile-1",
  title: "Visit the KU Campanile",
  description: "Prove you're at the iconic KU Campanile tower",
  objective: "Take a clear photo showing the KU Campanile bell tower",
  location: { name: "KU Campanile, Lawrence, KS" },
  stakeAmount: 20_000_000,
  durationMinutes: 20,
};

export default function AcceptChallengePage() {
  const params = useParams();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(CHALLENGE.durationMinutes * 60);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!accepted) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
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
    // Store accept timestamp
    sessionStorage.setItem("challengeAccepted", JSON.stringify({
      challengeId: params.id,
      acceptedAt: Date.now(),
      expiresAt: Date.now() + CHALLENGE.durationMinutes * 60 * 1000,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const xrpAmount = (CHALLENGE.stakeAmount / 1_000_000).toFixed(0);

  if (!accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              
              <h1 className="text-xl font-bold text-white mb-2">
                {CHALLENGE.title}
              </h1>
              
              <p className="text-zinc-400 text-sm mb-6">
                {CHALLENGE.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-zinc-300">
                  <Coins className="w-4 h-4 text-green-400" />
                  <span>{xrpAmount} XRP stake</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-zinc-300">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>{CHALLENGE.durationMinutes} minute time limit</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-zinc-300">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{CHALLENGE.location.name}</span>
                </div>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-6">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Timer starts when you accept. Complete the challenge before it expires!
                </p>
              </div>

              <Button 
                size="lg" 
                className="w-full text-lg"
                onClick={handleAccept}
              >
                Accept Challenge
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        {/* Timer */}
        <motion.div
          animate={{ scale: timeRemaining < 60 ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: timeRemaining < 60 ? Infinity : 0, duration: 1 }}
          className={`text-6xl font-mono font-bold mb-4 ${
            isExpired ? "text-red-500" : timeRemaining < 60 ? "text-orange-400" : "text-white"
          }`}
        >
          {formatTime(timeRemaining)}
        </motion.div>

        <p className="text-zinc-400 mb-2">Time remaining</p>

        <Card className={`mb-6 ${isExpired ? "bg-red-900/50 border-red-700" : "bg-zinc-800 border-zinc-700"}`}>
          <CardContent className="p-4">
            <h2 className="text-white font-semibold mb-2">{CHALLENGE.title}</h2>
            <p className="text-zinc-400 text-sm">{CHALLENGE.objective}</p>
          </CardContent>
        </Card>

        {!isExpired ? (
          <Button 
            size="lg" 
            className="w-full text-lg gap-2"
            onClick={() => router.push(`/challenge/${params.id}/capture`)}
          >
            <Camera className="w-5 h-5" />
            Capture Proof
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-red-400 font-medium">Challenge expired!</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/")}
            >
              Return Home
            </Button>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-8 w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full ${isExpired ? "bg-red-500" : timeRemaining < 60 ? "bg-orange-500" : "bg-green-500"}`}
            initial={{ width: "100%" }}
            animate={{ width: `${(timeRemaining / (CHALLENGE.durationMinutes * 60)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
