"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Camera, CheckCircle2, AlertTriangle, ChevronLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { EscrowLockAnimation } from "@/components/animations/EscrowLockAnimation";
import { MoneyFlowVisualization } from "@/components/animations/MoneyFlowVisualization";
import { getChallenge, saveChallenge, updateChallenge, ChallengeData } from "@/lib/store/challenges";
import { useWallet } from "@/lib/wallet-context";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";

function mapServerChallenge(c: Record<string, unknown>): ChallengeData {
  return {
    id: String(c.id),
    title: String(c.title),
    description: String(c.description),
    objective: String(c.objective),
    location: { name: String(c.location_name), lat: Number(c.location_lat), lng: Number(c.location_lng) },
    stakeAmount: Number(c.stake_amount_drops),
    durationMinutes: Number(c.duration_minutes),
    creatorAddress: String(c.escrow_owner || c.creator_id),
    status: String(c.status) as ChallengeData["status"],
    visibility: (String(c.visibility) || "private") as ChallengeData["visibility"],
    createdAt: new Date(String(c.created_at)).getTime(),
    expiresAt: new Date(String(c.expires_at)).getTime(),
    escrowTxHash: c.escrow_tx_hash ? String(c.escrow_tx_hash) : undefined,
    escrowSequence: c.escrow_sequence ? Number(c.escrow_sequence) : undefined,
    escrowOwner: c.escrow_owner ? String(c.escrow_owner) : undefined,
    challengeMode: (c.challenge_mode as "self" | "versus") || undefined,
    opponentAddress: c.opponent_address ? String(c.opponent_address) : undefined,
    acceptorAddress: c.acceptor_address ? String(c.acceptor_address) : undefined,
  };
}

export default function AcceptChallengePage() {
  const params = useParams();
  const router = useRouter();
  const wallet = useWallet();
  const id = params.id as string;

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [escrowState, setEscrowState] = useState<"idle" | "funding" | "locked">("idle");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Fetch challenge from server, fall back to local
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success && json.challenge) {
          const c = mapServerChallenge(json.challenge);
          setChallenge(c);
          saveChallenge(c);
          setTimeRemaining(c.durationMinutes * 60);
          setLoading(false);
          return;
        }
      } catch (err) { console.warn("[AcceptPage] Server fetch failed:", err); }
      if (mounted) {
        const stored = getChallenge(id);
        if (stored) {
          setChallenge(stored);
          setTimeRemaining(stored.durationMinutes * 60);
        }
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

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
    if (!challenge) return;
    setEscrowState("funding");
    setTimeout(() => {
      setEscrowState("locked");
    }, 1200);
    setTimeout(() => {
      setAccepted(true);
      const acceptedAt = Date.now();
      const expiresAt = acceptedAt + challenge.durationMinutes * 60 * 1000;
      sessionStorage.setItem(
        "challengeAccepted",
        JSON.stringify({ challengeId: id, acceptedAt, expiresAt })
      );
      updateChallenge(id, { status: "ACCEPTED", acceptedAt, acceptorAddress: wallet.address || "rAcceptorDemo" });
      setTimeRemaining(challenge.durationMinutes * 60);
    }, 2500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const xrpAmount = challenge ? challenge.stakeAmount / 1_000_000 : 0;
  const progress = challenge ? (timeRemaining / (challenge.durationMinutes * 60)) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)]">
        <header className="bg-white border-b border-[var(--vs-border)] p-4">
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-[var(--vs-text-primary)]">Challenge not found</h2>
          <Link href="/">
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pre-accept state
  if (!accepted) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)]">
        {/* Header */}
        <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
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

        <main className="max-w-xl mx-auto px-4 py-6">
          {/* Challenger banner */}
          {challenge.creatorAddress && challenge.creatorAddress !== "rDemo" && (
            <section className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-emerald-700">You were challenged by</p>
                  <p className="text-sm font-mono text-emerald-900 truncate">{challenge.creatorAddress}</p>
                </div>
              </div>
            </section>
          )}

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

          {/* Wallet-identity framing */}
          <section className="mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <img
                src="/illustrations/accept-challenge.jpg"
                alt="Trustless agreement"
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                draggable={false}
              />
              <p className="text-xs text-[var(--vs-text-secondary)]">
                No sign-up required — secured by XRPL escrow, not accounts.
              </p>
            </div>
          </section>

          {/* Money flow animation */}
          <section className="mb-6">
            <MoneyFlowVisualization
              flowState={escrowState === "idle" ? "idle" : escrowState === "funding" ? "funding" : "locked"}
              amountXrp={xrpAmount}
              creatorAddress={challenge.creatorAddress}
              compact
            />
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
        <div className="max-w-xl mx-auto">
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
      <main className="flex-1 max-w-xl mx-auto px-4 py-8 w-full">
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
