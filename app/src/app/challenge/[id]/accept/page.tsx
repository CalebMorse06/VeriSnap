"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Camera, CheckCircle2, AlertTriangle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { getChallenge, updateChallenge, ChallengeData } from "@/lib/store/challenges";
import Link from "next/link";

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

  const xrpAmount = challenge.stakeAmount / 1_000_000;
  const progress = (timeRemaining / (challenge.durationMinutes * 60)) * 100;

  // Pre-accept state
  if (!accepted) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)]">
        {/* Header */}
        <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link href={`/challenge/${id}`}>
              <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">Accept Challenge</h1>
              <p className="text-xs text-[var(--vs-text-tertiary)]">Review before accepting</p>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          {/* Challenge details */}
          <section className="mb-6 p-5 rounded-xl bg-white border border-[var(--vs-border)]">
            <h2 className="text-lg font-semibold text-[var(--vs-text-primary)] mb-1">{challenge.title}</h2>
            <p className="text-sm text-[var(--vs-text-secondary)] mb-4">{challenge.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[var(--vs-border-subtle)]">
                <span className="text-sm text-[var(--vs-text-secondary)]">Stake</span>
                <span className="font-semibold text-[var(--vs-text-primary)]">{xrpAmount} XRP</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--vs-border-subtle)]">
                <span className="text-sm text-[var(--vs-text-secondary)]">Time Limit</span>
                <span className="flex items-center gap-1.5 text-[var(--vs-text-primary)]">
                  <Clock className="w-4 h-4 text-amber-500" />
                  {challenge.durationMinutes} minutes
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--vs-text-secondary)]">Location</span>
                <span className="flex items-center gap-1.5 text-[var(--vs-text-primary)] text-sm">
                  <MapPin className="w-4 h-4 text-[var(--vs-text-tertiary)]" />
                  {challenge.location.name.split(",")[0]}
                </span>
              </div>
            </div>
          </section>

          {/* Objective */}
          <section className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Your Objective</p>
            <p className="text-sm text-emerald-900">{challenge.objective}</p>
          </section>

          {/* Warning */}
          <section className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 text-sm">Timer starts immediately</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Once you accept, you have {challenge.durationMinutes} minutes to capture and submit proof.
                </p>
              </div>
            </div>
          </section>

          {/* Escrow badge */}
          <section className="mb-6 flex justify-center">
            <TrustBadge variant="escrow" size="md" />
          </section>

          {/* Accept button */}
          <Button
            size="lg"
            className="w-full h-12 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={handleAccept}
          >
            <CheckCircle2 className="w-5 h-5" />
            Accept Challenge
          </Button>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
            <TrustPillars />
          </div>
        </main>
      </div>
    );
  }

  // Active timer state
  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)] flex flex-col">
      {/* Timer bar */}
      <div className={`py-4 px-4 ${isExpired ? "bg-red-500" : timeRemaining < 60 ? "bg-amber-500" : "bg-emerald-600"}`}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between text-white mb-2">
            <span className="text-sm font-medium">
              {isExpired ? "Time expired" : timeRemaining < 60 ? "Hurry!" : "Time remaining"}
            </span>
            <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
          </div>
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[var(--vs-text-primary)] mb-2">{challenge.title}</h1>
          <p className="text-sm text-[var(--vs-text-secondary)]">{challenge.objective}</p>
        </div>

        {/* Stake at risk */}
        <div className={`p-4 rounded-xl text-center mb-6 ${
          isExpired 
            ? "bg-red-50 border border-red-200" 
            : "bg-amber-50 border border-amber-200"
        }`}>
          <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${
            isExpired ? "text-red-600" : "text-amber-600"
          }`}>
            {isExpired ? "Stake forfeited" : "Stake at risk"}
          </p>
          <p className={`text-2xl font-semibold ${isExpired ? "text-red-700" : "text-amber-700"}`}>
            {xrpAmount} XRP
          </p>
        </div>

        {/* Action */}
        {!isExpired ? (
          <Button
            size="lg"
            className="w-full h-14 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-lg"
            onClick={() => router.push(`/challenge/${id}/capture`)}
          >
            <Camera className="w-5 h-5" />
            Capture Proof
          </Button>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-red-600 font-medium">Challenge failed — time expired</p>
            <Button 
              variant="outline" 
              className="w-full rounded-lg border-[var(--vs-border)]" 
              onClick={() => router.push("/")}
            >
              Return Home
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
