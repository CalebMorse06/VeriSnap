"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, Eye } from "lucide-react";
import { getChallenge, saveChallenge, updateChallenge, ChallengeData } from "@/lib/store/challenges";
import { useWallet } from "@/lib/wallet-context";
import { TrustPillars } from "@/components/ui/trust-badge";
import { Button } from "@/components/ui/button";
import { ProofPipeline } from "@/components/animations/ProofPipeline";
import { ProofReveal } from "@/components/animations/ProofReveal";
import Link from "next/link";

type VerifyStep = "uploading" | "analyzing" | "resolving" | "complete" | "error";

interface VerificationResult {
  passed: boolean;
  confidence: number;
  reasoning: string;
  sceneDescription?: string;
  proofCid?: string;
  settlementTx?: string;
  payoutTx?: string;
  settlementError?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const wallet = useWallet();
  const challengeId = params.id as string;
  const [currentStep, setCurrentStep] = useState<VerifyStep>("uploading");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [sceneDescription, setSceneDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verificationStarted = useRef(false);

  // Fetch challenge from server if not in local storage (cross-device)
  useEffect(() => {
    const local = getChallenge(challengeId);
    if (local) return;
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.challenge) {
          const c = json.challenge;
          const mapped: ChallengeData = {
            id: c.id, title: c.title, description: c.description, objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops, durationMinutes: c.duration_minutes,
            creatorAddress: c.escrow_owner || c.creator_id, status: c.status,
            visibility: c.visibility || "private", createdAt: new Date(c.created_at).getTime(),
            expiresAt: new Date(c.expires_at).getTime(),
            escrowTxHash: c.escrow_tx_hash || undefined, escrowSequence: c.escrow_sequence || undefined,
            escrowOwner: c.escrow_owner || undefined,
          };
          saveChallenge(mapped);
        }
      } catch (err) { console.warn("[VerifyPage] Server fetch failed:", err); }
    })();
  }, [challengeId]);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const proofData = sessionStorage.getItem("proofData");
    if (!proofData) {
      setError("No proof data found");
      setCurrentStep("error");
      return;
    }

    const parsed = JSON.parse(proofData) as {
      challengeId: string;
      imageData: string;
      capturedAt?: number;
      acceptedAt?: number;
    };
    setProofImage(parsed.imageData);

    updateChallenge(challengeId, { status: "VERIFYING" });
    runVerification(parsed);
  }, [challengeId]);

  async function runVerification(proofData: { 
    challengeId: string; 
    imageData: string; 
    capturedAt?: number;
    acceptedAt?: number;
  }) {
    try {
      setCurrentStep("uploading");
      await new Promise((r) => setTimeout(r, 800));

      setCurrentStep("analyzing");

      const challenge = getChallenge(challengeId);
      const challengeObjective = challenge?.objective ?? "Take a clear photo showing the challenge objective";

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: proofData.challengeId,
          imageData: proofData.imageData,
          challengeObjective,
          participantAddress: wallet.address || challenge?.acceptorAddress,
          escrowOwner: challenge?.escrowOwner,
          escrowSequence: challenge?.escrowSequence,
          capturedAt: proofData.capturedAt,
          acceptedAt: proofData.acceptedAt,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Verification request failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Verification failed");

      // Show scene description before resolving
      const scene = data.sceneDescription || data.verification.sceneDescription || "";
      if (scene) {
        setSceneDescription(scene);
      }
      setCurrentStep("resolving");
      await new Promise((r) => setTimeout(r, 2000));

      const verification: VerificationResult = {
        passed: data.verification.passed,
        confidence: data.verification.confidence,
        reasoning: data.verification.reasoning,
        sceneDescription: scene,
        proofCid: data.proofCid,
        settlementTx: data.settlementTx,
        payoutTx: data.payoutTx || undefined,
        settlementError: data.settlementError || undefined,
      };

      setResult(verification);
      setCurrentStep("complete");

      sessionStorage.setItem("verificationResult", JSON.stringify(verification));

      const nextStatus = verification.passed
        ? (verification.settlementTx ? "SETTLED" : "PASSED")
        : "FAILED";

      updateChallenge(challengeId, {
        status: nextStatus,
        resolvedAt: Date.now(),
        proofCid: verification.proofCid,
        visibility: "public",
        proofRevealed: true,
        verificationResult: {
          passed: verification.passed,
          confidence: verification.confidence,
          reasoning: verification.reasoning,
          sceneDescription: scene,
        },
        settlementTx: verification.settlementTx,
      });

      setTimeout(() => {
        router.push(`/challenge/${challengeId}/result?passed=${verification.passed}`);
      }, 1500);
    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCurrentStep("error");
      updateChallenge(challengeId, { status: "PROOF_SUBMITTED" });
    }
  }

  const proofRevealState = currentStep === "complete" && result?.passed
    ? "revealed"
    : currentStep === "complete"
    ? "revealing"
    : "locked";

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/challenge/${challengeId}`}>
            <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">Verifying</h1>
            <p className="text-xs text-[var(--vs-text-tertiary)]">Processing your proof</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto px-4 py-8 w-full">
        {/* Proof reveal */}
        {proofImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 max-w-xs mx-auto"
          >
            <ProofReveal imageUrl={proofImage} state={proofRevealState} />
          </motion.div>
        )}
        {!proofImage && (
          <div className="w-full max-w-xs mx-auto aspect-video rounded-xl bg-zinc-100 animate-pulse mb-8" />
        )}

        {/* Error state */}
        {currentStep === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-2">Verification Failed</p>
            {error && <p className="text-[var(--vs-text-secondary)] text-sm mb-6">{error}</p>}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="border-[var(--vs-border)]"
                onClick={() => router.push(`/challenge/${challengeId}/capture`)}
              >
                Retake Proof
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Pipeline */}
        {currentStep !== "error" && (
          <div className="flex justify-center mb-6">
            <ProofPipeline currentStep={currentStep} />
          </div>
        )}

        {/* AI Scene Description */}
        <AnimatePresence>
          {sceneDescription && currentStep !== "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">AI sees</span>
              </div>
              <p className="text-sm text-indigo-900 italic leading-relaxed">{sceneDescription}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result preview */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-6 rounded-2xl text-center ${
              result.passed
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              result.passed ? "bg-green-500" : "bg-red-500"
            }`}>
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className={`font-semibold ${result.passed ? "text-green-700" : "text-red-700"}`}>
              {result.passed ? "Challenge Passed!" : "Challenge Failed"}
            </p>
            <p className="text-[var(--vs-text-secondary)] text-sm mt-1">
              {result.confidence}% confidence
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
