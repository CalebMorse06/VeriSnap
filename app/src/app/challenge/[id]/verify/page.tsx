"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Brain, CheckCircle2, Loader2, AlertCircle, Database, Coins, ArrowLeft } from "lucide-react";
import { getChallenge, updateChallenge } from "@/lib/store/challenges";
import { TrustBadge } from "@/components/ui/trust-badge";
import Link from "next/link";

type VerifyStep = "uploading" | "analyzing" | "resolving" | "complete" | "error";

const steps = [
  { key: "uploading" as const, label: "Uploading to Pinata", sublabel: "Private IPFS storage", icon: Database, color: "purple" },
  { key: "analyzing" as const, label: "AI Verification", sublabel: "Gemini 2.0 Flash", icon: Brain, color: "blue" },
  { key: "resolving" as const, label: "XRPL Settlement", sublabel: "EscrowFinish transaction", icon: Coins, color: "emerald" },
];

interface VerificationResult {
  passed: boolean;
  confidence: number;
  reasoning: string;
  proofCid?: string;
  settlementTx?: string;
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

    const parsed = JSON.parse(proofData);
    setProofImage(parsed.imageData);

    updateChallenge(challengeId, { status: "VERIFYING" });
    runVerification(parsed);
  }, [challengeId]);

  async function runVerification(proofData: { challengeId: string; imageData: string }) {
    try {
      setCurrentStep("uploading");
      await new Promise((r) => setTimeout(r, 800));

      setCurrentStep("analyzing");

      const challenge = getChallenge(challengeId);
      const challengeObjective = challenge?.objective ?? "Take a clear photo showing the KU Campanile bell tower";

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: proofData.challengeId,
          imageData: proofData.imageData,
          challengeObjective,
          escrowOwner: challenge?.escrowOwner,
          escrowSequence: challenge?.escrowSequence,
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
      };

      setResult(verification);
      setCurrentStep("complete");

      sessionStorage.setItem("verificationResult", JSON.stringify(verification));
      updateChallenge(challengeId, {
        status: "SETTLED",
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

  const colorMap: Record<string, { bg: string; text: string }> = {
    purple: { bg: "bg-purple-500", text: "text-purple-500" },
    blue: { bg: "bg-blue-500", text: "text-blue-500" },
    emerald: { bg: "bg-emerald-500", text: "text-emerald-500" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Link href={`/challenge/${challengeId}`} className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-white font-semibold">Verifying Proof</h1>
          <p className="text-zinc-500 text-xs">Processing your submission</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Proof preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-40 h-40 rounded-2xl overflow-hidden mb-10 shadow-2xl ring-4 ring-zinc-700/50 relative"
        >
          {proofImage ? (
            <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-700 animate-pulse" />
          )}
          <div className="absolute bottom-2 right-2">
            <TrustBadge variant="private" size="sm" animated={false} />
          </div>
        </motion.div>

        {/* Error state */}
        {currentStep === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8 max-w-xs">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 font-medium mb-2">Verification Failed</p>
            {error && <p className="text-zinc-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2.5 text-sm rounded-xl bg-zinc-700 text-white font-medium"
                onClick={() => router.push(`/challenge/${challengeId}/capture`)}
              >
                Retake Proof
              </button>
              <button
                className="px-4 py-2.5 text-sm rounded-xl bg-blue-600 text-white font-medium"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress steps */}
        {currentStep !== "error" && (
          <div className="space-y-4 w-full max-w-sm">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex || currentStep === "complete";
              const Icon = step.icon;
              const colors = colorMap[step.color];

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-2xl border transition-all duration-500 ${
                    isComplete
                      ? "bg-zinc-800/50 border-green-500/30"
                      : isActive
                      ? "bg-zinc-800 border-zinc-600"
                      : "bg-zinc-800/30 border-zinc-700/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isComplete ? "bg-green-500" : isActive ? colors.bg : "bg-zinc-700"
                    }`}>
                      <AnimatePresence mode="wait">
                        {isActive && !isComplete ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </motion.div>
                        ) : isComplete ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </motion.div>
                        ) : (
                          <Icon className="w-6 h-6 text-zinc-400" />
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex-1">
                      <p className={`font-medium ${isComplete || isActive ? "text-white" : "text-zinc-500"}`}>
                        {step.label}
                      </p>
                      <p className={`text-sm ${isComplete ? "text-green-400" : isActive ? colors.text : "text-zinc-600"}`}>
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
            className={`mt-8 p-5 rounded-2xl ${result.passed ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.passed ? "bg-green-500" : "bg-red-500"}`}>
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-semibold ${result.passed ? "text-green-400" : "text-red-400"}`}>
                  {result.passed ? "Challenge Passed!" : "Challenge Failed"}
                </p>
                <p className="text-zinc-400 text-sm">Confidence: {result.confidence}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
