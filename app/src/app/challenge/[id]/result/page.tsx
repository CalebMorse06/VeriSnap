"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Home, ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustPillars } from "@/components/ui/trust-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { ShareOptions } from "@/components/challenge/ShareOptions";
import Link from "next/link";
import confetti from "canvas-confetti";
import { getChallenge, updateChallenge, type ChallengeVisibility, type ChallengeData } from "@/lib/store/challenges";

interface VerificationData {
  passed: boolean;
  confidence: number;
  reasoning: string;
  proofCid?: string;
  settlementTx?: string;
  settlementError?: string;
}

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const challengeId = params.id as string;
  const passed = searchParams.get("passed") === "true";
  const [challenge, setChallenge] = useState<ChallengeData | null>(getChallenge(challengeId));
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);

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
      } catch {}
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
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
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

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Result hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
              passed ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {passed ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : (
              <XCircle className="w-8 h-8 text-white" />
            )}
          </motion.div>

          <h2 className={`text-xl font-semibold ${passed ? "text-green-700" : "text-red-700"}`}>
            {passed ? "Challenge Passed" : "Challenge Failed"}
          </h2>
          <p className="text-[var(--vs-text-secondary)] text-sm mt-1">
            {confidence}% confidence
          </p>
        </motion.div>

        {/* Outcome card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-5 rounded-xl mb-6 ${
            passed 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${
            passed ? "text-green-600" : "text-red-600"
          }`}>
            {passed ? "Escrow Released" : "Stake Forfeited"}
          </p>
          <AmountDisplay
            drops={stakeDrops}
            variant="large"
            prefix={passed ? "+" : "-"}
          />
        </motion.div>

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

        {/* Proof image */}
        {proofImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 rounded-xl overflow-hidden border border-[var(--vs-border)]"
          >
            <img src={proofImage} alt="Proof" className="w-full aspect-video object-cover" />
          </motion.div>
        )}

        {/* Verification details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-white border border-[var(--vs-border)] mb-6"
        >
          <h3 className="text-sm font-medium text-[var(--vs-text-primary)] mb-3">Verification Details</h3>
          
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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

        {/* Home button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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
