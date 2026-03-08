"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, ChevronLeft, ExternalLink, AlertTriangle, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustPillars } from "@/components/ui/trust-badge";
import { ShareOptions } from "@/components/challenge/ShareOptions";
import { SettlementPulse } from "@/components/animations/SettlementPulse";
import { MoneyFlowVisualization } from "@/components/animations/MoneyFlowVisualization";
import { ProofReveal } from "@/components/animations/ProofReveal";
import Link from "next/link";
import confetti from "canvas-confetti";
import { getChallenge, updateChallenge, type ChallengeVisibility, type ChallengeData } from "@/lib/store/challenges";

interface VerificationData {
  passed: boolean;
  confidence: number;
  reasoning: string;
  sceneDescription?: string;
  proofCid?: string;
  settlementTx?: string;
  settlementError?: string;
}

interface DisputeData {
  id: string;
  ai_reverify_passed: boolean | null;
  ai_reverify_confidence: number | null;
  ai_reverify_reasoning: string | null;
  ai_reverify_scene_description: string | null;
  votes_pass: number;
  votes_fail: number;
  vote_deadline: string;
  status: string;
}

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const challengeId = params.id as string;
  const passed = searchParams.get("passed") === "true";
  const [challenge, setChallenge] = useState<ChallengeData | null>(getChallenge(challengeId));
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [settlementDone, setSettlementDone] = useState(false);
  const [proofRevealState, setProofRevealState] = useState<"locked" | "revealing" | "revealed">("locked");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [moneyFlowState, setMoneyFlowState] = useState<"locked" | "settling" | "complete" | "failed">("locked");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [dispute, setDispute] = useState<DisputeData | null>(null);

  useEffect(() => {
    let mounted = true;

    // Pull freshest server state for settlement/privacy accuracy
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && res.ok && json.success && json.challenge) {
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
            acceptedAt: c.accepted_at ? new Date(c.accepted_at).getTime() : undefined,
            resolvedAt: c.resolved_at ? new Date(c.resolved_at).getTime() : undefined,
            escrowTxHash: c.escrow_tx_hash,
            escrowSequence: c.escrow_sequence,
            escrowOwner: c.escrow_owner,
            proofCid: c.proof_cid ?? undefined,
            proofRevealed: c.proof_revealed,
            settlementTx: c.settlement_tx ?? undefined,
            verificationResult: c.verification_passed === null ? undefined : {
              passed: Boolean(c.verification_passed),
              confidence: Number(c.verification_confidence ?? 0),
              reasoning: String(c.verification_reasoning ?? ""),
            },
          });
        }
      } catch (err) { console.warn("[ResultPage] Server fetch failed:", err); }
    })();

    updateChallenge(challengeId, { status: "SETTLED" });

    const proofData = sessionStorage.getItem("proofData");
    if (proofData) {
      const parsed = JSON.parse(proofData);
      setProofImage(parsed.imageData);
    }

    const verificationResult = sessionStorage.getItem("verificationResult");
    if (verificationResult) {
      setVerification(JSON.parse(verificationResult));
    }

    // Money flow animation sequence
    setTimeout(() => setMoneyFlowState("settling"), 600);
    setTimeout(() => setMoneyFlowState(passed ? "complete" : "failed"), 1600);

    if (passed) {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 500);
    }

    return () => { mounted = false; };
  }, [passed, challengeId]);

  const confidence = verification?.confidence ?? (passed ? 94 : 32);
  const reasoning = verification?.reasoning ?? (passed
    ? "The submitted image clearly shows the challenge objective."
    : "Unable to verify the challenge objective in the submitted image.");
  const proofCid = verification?.proofCid ?? challenge?.proofCid;
  const settlementTx = verification?.settlementTx ?? challenge?.settlementTx;
  const stakeDrops = challenge?.stakeAmount ?? 20_000_000;

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">Result</h1>
            <p className="text-xs text-[var(--vs-text-tertiary)]">Challenge complete</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Result hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 300, damping: 20 }}
            className="relative mx-auto mb-6 w-[160px] h-[160px]"
          >
            {passed && <div className="absolute inset-0 bg-green-100/60 blur-3xl rounded-full" />}
            <img
              src={passed ? "/illustrations/challenge-passed.png" : "/illustrations/challenge-failed.png"}
              alt={passed ? "Challenge Passed" : "Challenge Failed"}
              className="relative w-full h-full object-contain"
              draggable={false}
            />
          </motion.div>

          <h2 className={`text-3xl font-bold tracking-tight ${passed ? "text-green-700" : "text-red-700"}`}>
            {passed ? "Challenge Passed" : "Challenge Failed"}
          </h2>
          <p className="text-[var(--vs-text-secondary)] text-sm mt-1">
            {confidence}% confidence
          </p>
          <p className="text-[var(--vs-text-tertiary)] text-xs mt-1">
            {passed ? "Your stake has been released" : "Better luck next time"}
          </p>
        </motion.div>

        {/* Money flow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 p-4 rounded-xl bg-white border border-[var(--vs-border)]"
        >
          <MoneyFlowVisualization
            flowState={moneyFlowState}
            amountXrp={stakeDrops / 1_000_000}
            creatorAddress={challenge?.creatorAddress}
            winnerAddress={challenge?.acceptorAddress || challenge?.creatorAddress}
            txHash={settlementTx}
            compact
          />
        </motion.div>

        {/* Settlement pulse */}
        <SettlementPulse
          amountDrops={stakeDrops}
          passed={passed}
          onCountComplete={() => {
            setSettlementDone(true);
            setProofRevealState("revealing");
            setTimeout(() => {
              setProofRevealState("revealed");
              setDetailsVisible(true);
              setTimeout(() => setShareVisible(true), 300);
            }, 800);
          }}
        />

        {verification?.settlementError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200"
          >
            <p className="text-sm font-medium text-amber-800">Settlement Pending</p>
            <p className="text-xs text-amber-700 mt-1">
              Verification passed, but XRPL settlement is retrying. Please check back shortly.
            </p>
          </motion.div>
        )}

        {/* Proof reveal */}
        {proofImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: settlementDone ? 1 : 0, y: settlementDone ? 0 : 10 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <ProofReveal imageUrl={proofImage} state={proofRevealState} />
          </motion.div>
        )}

        {/* Verification details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: detailsVisible ? 1 : 0, y: detailsVisible ? 0 : 10 }}
          transition={{ duration: 0.4 }}
          className="p-4 rounded-xl bg-white border border-[var(--vs-border)] mb-6"
        >
          <h3 className="text-sm font-medium text-[var(--vs-text-primary)] mb-3">Verification Details</h3>

          {(verification?.sceneDescription || challenge?.verificationResult?.sceneDescription) && (
            <div className="mb-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">AI Scene Analysis</span>
              </div>
              <p className="text-sm text-indigo-900 italic">
                {verification?.sceneDescription || challenge?.verificationResult?.sceneDescription}
              </p>
            </div>
          )}

          <p className="text-sm text-[var(--vs-text-secondary)] mb-4">{reasoning}</p>

          <div className="space-y-2 text-xs">
            {proofCid && (
              <div className="flex items-center justify-between py-2 border-t border-[var(--vs-border-subtle)]">
                <span className="text-[var(--vs-text-tertiary)]">Proof CID</span>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${proofCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-mono"
                >
                  {proofCid.slice(0, 12)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {settlementTx && (
              <div className="flex items-center justify-between py-2 border-t border-[var(--vs-border-subtle)]">
                <span className="text-[var(--vs-text-tertiary)]">Settlement TX</span>
                <a
                  href={`https://testnet.xrpl.org/transactions/${settlementTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-mono"
                >
                  {settlementTx.slice(0, 12)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Share options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: shareVisible ? 1 : 0, y: shareVisible ? 0 : 10 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <ShareOptions
            challengeId={challengeId}
            currentVisibility={challenge?.visibility ?? "private"}
            onVisibilityChange={(v: ChallengeVisibility) => {
              updateChallenge(challengeId, { visibility: v, proofRevealed: v !== "private" });
              setChallenge((prev) => prev ? { ...prev, visibility: v, proofRevealed: v !== "private" } : prev);
            }}
          />
        </motion.div>

        {/* Dispute system — only on fail */}
        {!passed && shareVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            {!dispute && !showDisputeForm && (
              <Button
                variant="outline"
                className="w-full h-11 gap-2 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setShowDisputeForm(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                Dispute Result
              </Button>
            )}

            {showDisputeForm && !dispute && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <p className="text-sm font-medium text-amber-900">Why do you think this result is wrong?</p>
                <input
                  type="text"
                  placeholder="Optional: describe why this should pass..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Button
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                  disabled={disputeLoading}
                  onClick={async () => {
                    setDisputeLoading(true);
                    try {
                      const res = await fetch("/api/disputes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          challengeId,
                          reason: disputeReason || "I believe this result is incorrect",
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.dispute) {
                        setDispute(data.dispute);
                        updateChallenge(challengeId, { status: "DISPUTED" });
                        setChallenge((prev) => prev ? { ...prev, status: "DISPUTED" } : prev);
                      }
                    } catch (err) { console.warn("[ResultPage] Dispute submit failed:", err); }
                    setDisputeLoading(false);
                  }}
                >
                  {disputeLoading ? "Re-verifying..." : "Submit Dispute"}
                </Button>
              </div>
            )}

            {dispute && (
              <div className="p-4 rounded-xl bg-white border border-[var(--vs-border)] space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-[var(--vs-text-primary)]">Dispute Filed</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                    dispute.status === "resolved_pass" ? "bg-green-100 text-green-700" :
                    dispute.status === "resolved_fail" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {dispute.status === "resolved_pass" ? "Upheld" :
                     dispute.status === "resolved_fail" ? "Denied" : "Open"}
                  </span>
                </div>

                {dispute.ai_reverify_passed !== null && (
                  <div className={`p-3 rounded-lg ${dispute.ai_reverify_passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <p className="text-xs font-medium mb-1 text-zinc-600">AI Re-verification</p>
                    <p className={`text-sm font-medium ${dispute.ai_reverify_passed ? "text-green-700" : "text-red-700"}`}>
                      {dispute.ai_reverify_passed ? "Passed" : "Failed"} ({dispute.ai_reverify_confidence}% confidence)
                    </p>
                    {dispute.ai_reverify_scene_description && (
                      <p className="text-xs text-zinc-600 italic mt-1">{dispute.ai_reverify_scene_description}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--vs-text-tertiary)]">Community Vote</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-green-600">
                      <ThumbsUp className="w-3.5 h-3.5" /> {dispute.votes_pass}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <ThumbsDown className="w-3.5 h-3.5" /> {dispute.votes_fail}
                    </span>
                  </div>
                </div>

                {dispute.vote_deadline && (
                  <p className="text-xs text-[var(--vs-text-tertiary)]">
                    Voting ends: {new Date(dispute.vote_deadline).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Home button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: shareVisible ? 1 : 0, y: shareVisible ? 0 : 10 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          <Link href="/disputes">
            <Button variant="outline" className="w-full h-11 gap-2 rounded-lg border-[var(--vs-border)] text-[var(--vs-text-secondary)]">
              <AlertTriangle className="w-4 h-4" />
              View Community Disputes
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full h-12 gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
