"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, Database, Cpu, Lock, ChevronLeft } from "lucide-react";
import { getChallenge, updateChallenge } from "@/lib/store/challenges";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type VerifyStep = "uploading" | "analyzing" | "resolving" | "complete" | "error";

const steps = [
  { key: "uploading" as const, label: "Uploading Proof", sublabel: "Private IPFS via Pinata", icon: Database },
  { key: "analyzing" as const, label: "AI Verification", sublabel: "Gemini 2.0 Flash", icon: Cpu },
  { key: "resolving" as const, label: "Settlement", sublabel: "XRPL EscrowFinish", icon: Lock },
];

interface VerificationResult {
  passed: boolean;
  confidence: number;
  reasoning: string;
  proofCid?: string;
  settlementTx?: string;
  settlementError?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const [currentStep, setCurrentStep] = useState<VerifyStep>("uploading");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verificationStarted = useRef(false);

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
          escrowOwner: challenge?.escrowOwner,
          escrowSequence: challenge?.escrowSequence,
          capturedAt: proofData.capturedAt,
          acceptedAt: proofData.acceptedAt,
        }),
      });

      if (!response.ok) throw new Error("Verification request failed");

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Verification failed");

      setCurrentStep("resolving");
      await new Promise((r) => setTimeout(r, 1000));

      const verification: VerificationResult = {
        passed: data.verification.passed,
        confidence: data.verification.confidence,
        reasoning: data.verification.reasoning,
        proofCid: data.proofCid,
        settlementTx: data.settlementTx,
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
        verificationResult: {
          passed: verification.passed,
          confidence: verification.confidence,
          reasoning: verification.reasoning,
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

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
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

      <main className="flex-1 max-w-lg mx-auto px-4 py-8 w-full">
        {/* Proof preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 rounded-xl overflow-hidden mx-auto mb-8 border border-[var(--vs-border)] shadow-sm relative"
        >
          {proofImage ? (
            <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-100 animate-pulse" />
          )}
        </motion.div>

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

        {/* Progress steps */}
        {currentStep !== "error" && (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex || currentStep === "complete";
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isComplete
                      ? "bg-green-50 border-green-200"
                      : isActive
                      ? "bg-white border-emerald-200 shadow-sm"
                      : "bg-zinc-50 border-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isComplete 
                        ? "bg-green-500" 
                        : isActive 
                        ? "bg-emerald-600" 
                        : "bg-zinc-200"
                    }`}>
                      <AnimatePresence mode="wait">
                        {isActive && !isComplete ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </motion.div>
                        ) : isComplete ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </motion.div>
                        ) : (
                          <Icon className="w-5 h-5 text-zinc-400" />
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex-1">
                      <p className={`font-medium text-sm ${
                        isComplete || isActive ? "text-[var(--vs-text-primary)]" : "text-[var(--vs-text-tertiary)]"
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-xs ${
                        isComplete ? "text-green-600" : isActive ? "text-emerald-600" : "text-[var(--vs-text-tertiary)]"
                      }`}>
                        {isComplete ? "Complete" : isActive ? "Processing..." : step.sublabel}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Result preview */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-5 rounded-xl text-center ${
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
