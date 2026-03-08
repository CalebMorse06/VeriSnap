"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, ChevronLeft, User, Users, Globe, Lock, ExternalLink, ArrowRight, Timer, Camera, Copy, Check, Link2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { EscrowLockAnimation } from "@/components/animations/EscrowLockAnimation";
import { MoneyFlowVisualization } from "@/components/animations/MoneyFlowVisualization";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { getChallenge, updateChallenge, ChallengeData } from "@/lib/store/challenges";
import { useWallet } from "@/lib/wallet-context";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const wallet = useWallet();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selfStarted, setSelfStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success && json.challenge) {
          const c = json.challenge;
          setChallenge({
            id: c.id,
            title: c.title,
            description: c.description,
            objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops,
            durationMinutes: c.duration_minutes,
            creatorAddress: c.escrow_owner || c.creator_id,
            status: c.status,
            visibility: c.visibility || "private",
            createdAt: new Date(c.created_at).getTime(),
            expiresAt: new Date(c.expires_at).getTime(),
            escrowTxHash: c.escrow_tx_hash,
            escrowSequence: c.escrow_sequence,
            escrowOwner: c.escrow_owner,
            challengeMode: c.challenge_mode || undefined,
            opponentAddress: c.opponent_address || undefined,
            acceptorAddress: c.acceptor_address || undefined,
          });
          if (mounted) setLoading(false);
          return;
        }
      } catch (err) { console.warn("[ChallengePage] Server fetch failed:", err); }

      if (mounted) {
        const stored = getChallenge(challengeId);
        if (stored) setChallenge(stored);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [challengeId]);

  // Poll for status updates (creator waiting for acceptance, then waiting for proof)
  useEffect(() => {
    if (!challenge || challenge.challengeMode === "self") return;
    // Poll while FUNDED (waiting for accept), ACCEPTED (waiting for proof), or VERIFYING
    const pollStatuses = ["FUNDED", "ACCEPTED", "PROOF_SUBMITTED", "VERIFYING"];
    if (!pollStatuses.includes(challenge.status)) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.challenge?.status !== challenge.status) {
          setChallenge(prev => prev ? {
            ...prev,
            status: json.challenge.status,
            acceptorAddress: json.challenge.acceptor_address || undefined,
          } : prev);
        }
      } catch (err) {
        console.warn("[ChallengePage] Poll failed:", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [challenge?.status, challenge?.challengeMode, challengeId]);

  // Self-challenge countdown timer
  useEffect(() => {
    if (!selfStarted || timeRemaining === null) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selfStarted, timeRemaining]);

  const handleSelfStart = () => {
    if (!challenge) return;
    const acceptedAt = Date.now();
    const expiresAt = acceptedAt + challenge.durationMinutes * 60 * 1000;
    sessionStorage.setItem(
      "challengeAccepted",
      JSON.stringify({ challengeId, acceptedAt, expiresAt })
    );
    updateChallenge(challengeId, { status: "ACCEPTED", acceptedAt });
    setChallenge((prev) => prev ? { ...prev, status: "ACCEPTED", acceptedAt } : prev);
    setSelfStarted(true);
    setTimeRemaining(challenge.durationMinutes * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isSelfChallenge = challenge?.challengeMode === "self";
  const isBounty = challenge?.challengeMode === "bounty";
  // Check creator via wallet match OR local store (covers case where server stores app wallet as escrow_owner)
  const localChallenge = getChallenge(challengeId);
  const isCreator = !!(
    (wallet.address && challenge?.creatorAddress === wallet.address) ||
    (wallet.address && localChallenge?.creatorAddress === wallet.address)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--vs-bg-primary)]">
        <header className="bg-white border-b border-[var(--vs-border)] p-4">
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
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

  const xrpAmount = challenge.stakeAmount / 1_000_000;

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[var(--vs-text-primary)] truncate">{challenge.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              challenge.status === "FUNDED" ? "bg-emerald-100 text-emerald-700" :
              challenge.status === "ACCEPTED" ? "bg-amber-100 text-amber-700" :
              challenge.status === "VERIFYING" || challenge.status === "PROOF_SUBMITTED" ? "bg-blue-100 text-blue-700" :
              challenge.status === "PASSED" || challenge.status === "SETTLED" ? "bg-emerald-100 text-emerald-700" :
              challenge.status === "FAILED" ? "bg-red-100 text-red-700" :
              "bg-zinc-100 text-zinc-700"
            }`}>
              {challenge.status === "FUNDED" ? "Open" :
               challenge.status === "ACCEPTED" ? "In Progress" :
               challenge.status === "PROOF_SUBMITTED" ? "Verifying" :
               challenge.status === "VERIFYING" ? "Verifying" :
               challenge.status === "PASSED" || challenge.status === "SETTLED" ? "Completed" :
               challenge.status === "FAILED" ? "Failed" :
               challenge.status}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-[var(--vs-text-primary)]">{xrpAmount}</span>
            <span className="text-xs text-[var(--vs-text-tertiary)] ml-1">XRP</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-[var(--vs-text-secondary)] leading-relaxed">{challenge.description}</p>
        </motion.section>

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="p-4 rounded-2xl bg-white border border-[var(--vs-border)] text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--vs-text-primary)]">{challenge.durationMinutes}</p>
            <p className="text-xs text-[var(--vs-text-tertiary)]">minutes</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[var(--vs-border)] text-center">
            <div className="w-5 h-5 rounded-full bg-emerald-500 mx-auto mb-1 flex items-center justify-center">
              <span className="text-white text-xs font-bold">$</span>
            </div>
            <p className="text-lg font-semibold text-[var(--vs-text-primary)]">{xrpAmount}</p>
            <p className="text-xs text-[var(--vs-text-tertiary)]">XRP stake</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[var(--vs-border)] text-center">
            <MapPin className="w-5 h-5 text-[var(--vs-text-tertiary)] mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--vs-text-primary)]">1</p>
            <p className="text-xs text-[var(--vs-text-tertiary)]">location</p>
          </div>
        </motion.section>

        {/* Objective */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">Verification Objective</p>
          <p className="text-sm text-emerald-900 leading-relaxed">{challenge.objective}</p>
        </motion.section>

        {/* Location */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 p-4 rounded-xl bg-white border border-[var(--vs-border)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[var(--vs-text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--vs-text-primary)]">Location</p>
          </div>
          <p className="text-sm text-[var(--vs-text-secondary)]">{challenge.location.name}</p>
        </motion.section>

        {/* Money Flow Visualization */}
        {challenge.escrowTxHash && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-5 rounded-xl bg-white border border-[var(--vs-border)] flex flex-col items-center"
          >
            <MoneyFlowVisualization
              flowState="locked"
              amountXrp={xrpAmount}
              creatorAddress={challenge.creatorAddress}
              winnerAddress={challenge.opponentAddress}
              txHash={challenge.escrowTxHash}
            />
            <a
              href={`https://testnet.xrpl.org/transactions/${challenge.escrowTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              View on XRPL
              <ExternalLink className="w-3 h-3" />
            </a>
          </motion.section>
        )}

        {/* Two-party display for versus, single creator for self */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          {challenge.challengeMode === "bounty" ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-amber-900">Public Bounty</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">Open to all</span>
                  </div>
                  <p className="text-xs font-mono text-amber-700 truncate mt-0.5">
                    Created by {challenge.creatorAddress}
                  </p>
                </div>
              </div>
            </div>
          ) : challenge.challengeMode === "versus" ? (
            <div className="flex items-center gap-2">
              {/* Challenger */}
              <div className="flex-1 p-3 rounded-xl bg-white border border-[var(--vs-border)] text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-[var(--vs-text-tertiary)]">Challenger</p>
                <p className="text-xs font-mono text-[var(--vs-text-secondary)] truncate mt-0.5">
                  {challenge.creatorAddress}
                </p>
              </div>

              {/* VS badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
                <span className="text-xs font-bold text-white">VS</span>
              </div>

              {/* Opponent */}
              <div className="flex-1 p-3 rounded-xl bg-white border border-[var(--vs-border)] text-center">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-1.5">
                  <Users className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-xs text-[var(--vs-text-tertiary)]">Opponent</p>
                {challenge.acceptorAddress ? (
                  <p className="text-xs font-mono text-[var(--vs-text-secondary)] truncate mt-0.5">
                    {challenge.acceptorAddress}
                  </p>
                ) : challenge.opponentAddress ? (
                  <div className="mt-0.5">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span className="text-[10px] font-medium text-amber-600">Wallet-gated</span>
                    </div>
                    <p className="text-xs font-mono text-[var(--vs-text-secondary)] truncate">
                      {challenge.opponentAddress.slice(0, 6)}...{challenge.opponentAddress.slice(-4)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-0.5">
                    <img
                      src="/illustrations/challenge-pending.png"
                      alt="Waiting for opponent"
                      className="w-14 h-14 mx-auto mb-1.5 object-contain opacity-80"
                      draggable={false}
                    />
                    <p className="text-xs text-amber-600">Waiting...</p>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/challenge/${challengeId}`;
                        navigator.clipboard.writeText(url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      {linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {linkCopied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white border border-[var(--vs-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--vs-text-tertiary)]">Created by</p>
                  <p className="text-sm font-mono text-[var(--vs-text-secondary)] truncate">
                    {challenge.creatorAddress}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* QR Code — for versus/bounty challenges that are still open */}
        {!isSelfChallenge && challenge.status === "FUNDED" && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mb-6"
          >
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-300 text-sm text-[var(--vs-text-secondary)] hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              {showQr ? "Hide QR Code" : "Show QR Code"}
            </button>
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex flex-col items-center p-6 rounded-xl bg-white border border-[var(--vs-border)]"
              >
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG
                    value={typeof window !== "undefined"
                      ? `${window.location.origin}/challenge/${challengeId}/accept`
                      : `/challenge/${challengeId}/accept`}
                    size={180}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-sm font-medium text-[var(--vs-text-primary)] mt-3">Scan to accept</p>
                <p className="text-xs text-[var(--vs-text-tertiary)] mt-1">
                  {isBounty ? "Anyone can scan and attempt this bounty" : "Share this with your opponent"}
                </p>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* Action button */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isSelfChallenge && !selfStarted && (
            <>
              <Button
                size="lg"
                className="w-full h-12 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                onClick={handleSelfStart}
              >
                <Timer className="w-4 h-4" />
                Start Timer
              </Button>
              <p className="text-center text-xs text-[var(--vs-text-tertiary)] mt-3">
                Challenge yourself — {challenge.durationMinutes} min countdown begins
              </p>
            </>
          )}

          {isSelfChallenge && selfStarted && (
            <div className="space-y-4">
              {/* Timer display */}
              <div className={`p-4 rounded-xl text-center ${
                timeRemaining !== null && timeRemaining < 60 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
              }`}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1 text-amber-600">Time remaining</p>
                <p className="text-3xl font-mono font-bold text-amber-700">
                  {timeRemaining !== null ? formatTimer(timeRemaining) : "--:--"}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full h-14 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-lg"
                onClick={() => router.push(`/challenge/${challengeId}/capture`)}
                disabled={timeRemaining === 0}
              >
                <Camera className="w-5 h-5" />
                Capture Proof
              </Button>
            </div>
          )}

          {/* Challenge accepted — creator waits, acceptor captures */}
          {!isSelfChallenge && challenge.status === "ACCEPTED" && isCreator && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-[var(--vs-text-primary)]">Challenge accepted!</p>
              <p className="text-xs text-[var(--vs-text-tertiary)]">
                Waiting for {challenge.acceptorAddress
                  ? `${challenge.acceptorAddress.slice(0, 6)}...${challenge.acceptorAddress.slice(-4)}`
                  : "your opponent"} to complete the challenge and submit proof.
              </p>
            </div>
          )}

          {!isSelfChallenge && challenge.status === "ACCEPTED" && !isCreator && (
            <Button
              size="lg"
              className="w-full h-14 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-lg"
              onClick={() => router.push(`/challenge/${challengeId}/capture`)}
            >
              <Camera className="w-5 h-5" />
              Capture Proof
            </Button>
          )}

          {/* Creator waiting for opponent */}
          {!isSelfChallenge && isCreator && challenge.status === "FUNDED" && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-2">
              <p className="text-sm font-medium text-[var(--vs-text-primary)]">Waiting for opponent</p>
              <p className="text-xs text-[var(--vs-text-tertiary)]">
                Share the QR code or link above for someone to accept
              </p>
            </div>
          )}

          {/* Non-creator can accept */}
          {!isSelfChallenge && !isCreator && challenge.status === "FUNDED" && (
            <>
              <Button
                size="lg"
                className={`w-full h-12 gap-2 rounded-xl text-white font-medium shadow-sm ${
                  isBounty
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                onClick={() => router.push(`/challenge/${challengeId}/accept`)}
              >
                {isBounty ? (
                  <>
                    <Globe className="w-4 h-4" />
                    Attempt Bounty
                  </>
                ) : (
                  <>
                    Accept Challenge
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-[var(--vs-text-tertiary)] mt-3">
                {xrpAmount} XRP will be locked in XRPL escrow
              </p>
            </>
          )}

          {/* Verifying state */}
          {(challenge.status === "PROOF_SUBMITTED" || challenge.status === "VERIFYING") && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-[var(--vs-text-primary)]">Proof submitted — verifying...</p>
              <p className="text-xs text-[var(--vs-text-tertiary)]">
                AI is reviewing the proof. This page will update automatically.
              </p>
            </div>
          )}

          {/* Completed — passed */}
          {(challenge.status === "PASSED" || challenge.status === "SETTLED") && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-emerald-800">Challenge completed!</p>
                <p className="text-xs text-[var(--vs-text-tertiary)]">
                  Proof was verified and {xrpAmount} XRP has been released.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full h-12 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                onClick={() => router.push(`/challenge/${challengeId}/result?passed=true`)}
              >
                View Results
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Failed */}
          {challenge.status === "FAILED" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
                <p className="text-sm font-medium text-red-800">Challenge failed</p>
                <p className="text-xs text-[var(--vs-text-tertiary)]">
                  The proof did not meet the verification criteria.
                </p>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 gap-2 rounded-xl border-[var(--vs-border)] font-medium"
                onClick={() => router.push(`/challenge/${challengeId}/result?passed=false`)}
              >
                View Results
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
