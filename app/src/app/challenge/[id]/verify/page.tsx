"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Brain, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getChallenge, updateChallenge } from "@/lib/store/challenges";

type VerifyStep = "uploading" | "analyzing" | "resolving" | "complete" | "error";

const steps = [
  { key: "uploading" as const, label: "Uploading to Pinata", icon: Upload },
  { key: "analyzing" as const, label: "AI Verification", icon: Brain },
  { key: "resolving" as const, label: "Resolving on XRPL", icon: CheckCircle2 },
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
      await new Promise((r) => setTimeout(r, 500));

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
      await new Promise((r) => setTimeout(r, 800));

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
        status: verification.passed ? "SETTLED" : "SETTLED",
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
      }, 1200);
    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCurrentStep("error");
      updateChallenge(challengeId, { status: "PROOF_SUBMITTED" });
    }
  }

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-48 h-48 rounded-2xl overflow-hidden mb-12 shadow-2xl ring-4 ring-zinc-700">
        {proofImage ? <img src={proofImage} alt="Proof" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-700 animate-pulse" />}
      </motion.div>

      {currentStep === "error" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 text-sm">Verification failed</p>
          {error && <p className="text-zinc-400 text-xs mt-1">{error}</p>}
          <div className="flex gap-2 justify-center mt-4">
            <button
              className="px-3 py-2 text-sm rounded bg-zinc-700 text-white"
              onClick={() => router.push(`/challenge/${challengeId}/capture`)}
            >
              Retake Proof
            </button>
            <button
              className="px-3 py-2 text-sm rounded bg-blue-600 text-white"
              onClick={() => window.location.reload()}
            >
              Retry Verify
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-6 w-full max-w-sm">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex || currentStep === "complete";
          const Icon = step.icon;

          return (
            <motion.div key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isComplete ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-zinc-700"}`}>
                <AnimatePresence mode="wait">
                  {isActive && !isComplete ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div key="icon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <p className={`font-medium ${isComplete || isActive ? "text-white" : "text-zinc-500"}`}>{step.label}</p>
                {isActive && <p className="text-sm text-zinc-400">Processing...</p>}
                {isComplete && <p className="text-sm text-green-400">Complete</p>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 p-4 rounded-xl ${result.passed ? "bg-green-900/50" : "bg-red-900/50"}`}>
          <p className={`font-semibold ${result.passed ? "text-green-400" : "text-red-400"}`}>{result.passed ? "✓ Challenge Passed" : "✗ Challenge Failed"}</p>
          <p className="text-zinc-400 text-sm mt-1">Confidence: {result.confidence}%</p>
        </motion.div>
      )}
    </div>
  );
}
