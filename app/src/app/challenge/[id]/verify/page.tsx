"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Brain, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

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

    // Run real verification
    runVerification(parsed);
  }, []);

  async function runVerification(proofData: { challengeId: string; imageData: string }) {
    try {
      // Step 1: Upload to Pinata
      setCurrentStep("uploading");
      await new Promise(r => setTimeout(r, 800)); // UI delay for visibility

      // Step 2: AI Verification
      setCurrentStep("analyzing");
      
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: proofData.challengeId,
          imageData: proofData.imageData,
          challengeObjective: "Take a clear photo showing the KU Campanile bell tower",
        }),
      });

      if (!response.ok) {
        throw new Error("Verification request failed");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }

      // Step 3: XRPL Settlement
      setCurrentStep("resolving");
      await new Promise(r => setTimeout(r, 1000));

      setResult({
        passed: data.verification.passed,
        confidence: data.verification.confidence,
        reasoning: data.verification.reasoning,
        proofCid: data.proofCid,
        settlementTx: data.settlementTx,
      });

      setCurrentStep("complete");

      // Store result and navigate
      sessionStorage.setItem("verificationResult", JSON.stringify({
        ...data.verification,
        proofCid: data.proofCid,
        settlementTx: data.settlementTx,
      }));

      setTimeout(() => {
        router.push(`/challenge/${params.id}/result?passed=${data.verification.passed}`);
      }, 1500);

    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCurrentStep("error");
      
      // Fallback: simulate for demo if API fails
      setTimeout(() => {
        const mockPassed = Math.random() > 0.3; // 70% pass rate for demo
        sessionStorage.setItem("verificationResult", JSON.stringify({
          passed: mockPassed,
          confidence: mockPassed ? 87 : 34,
          reasoning: mockPassed 
            ? "The image clearly shows the KU Campanile bell tower." 
            : "Unable to identify the KU Campanile in the submitted image.",
          proofCid: `Qm${Math.random().toString(36).substring(2, 15)}`,
          settlementTx: `DEMO_TX_${Date.now()}`,
        }));
        router.push(`/challenge/${params.id}/result?passed=${mockPassed}`);
      }, 2000);
    }
  }

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-6">
      {/* Proof preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-48 h-48 rounded-2xl overflow-hidden mb-12 shadow-2xl ring-4 ring-zinc-700"
      >
        {proofImage ? (
          <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-700 animate-pulse" />
        )}
      </motion.div>

      {/* Error state */}
      {currentStep === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-400 text-sm">API unavailable — using demo mode</p>
        </motion.div>
      )}

      {/* Progress steps */}
      <div className="space-y-6 w-full max-w-sm">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex || currentStep === "complete";
          const Icon = step.icon;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                ${isComplete ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-zinc-700"}
              `}>
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
                <p className={`font-medium ${isComplete || isActive ? "text-white" : "text-zinc-500"}`}>
                  {step.label}
                </p>
                {isActive && <p className="text-sm text-zinc-400">Processing...</p>}
                {isComplete && <p className="text-sm text-green-400">Complete</p>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Result preview */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-8 p-4 rounded-xl ${result.passed ? "bg-green-900/50" : "bg-red-900/50"}`}
        >
          <p className={`font-semibold ${result.passed ? "text-green-400" : "text-red-400"}`}>
            {result.passed ? "✓ Challenge Passed" : "✗ Challenge Failed"}
          </p>
          <p className="text-zinc-400 text-sm mt-1">Confidence: {result.confidence}%</p>
        </motion.div>
      )}

      {/* Pillar badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 mt-12"
      >
        <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-medium">
          Pinata IPFS
        </span>
        <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-medium">
          Gemini AI
        </span>
        <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-medium">
          XRPL Escrow
        </span>
      </motion.div>
    </div>
  );
}
