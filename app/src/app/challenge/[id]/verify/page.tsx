"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Brain, CheckCircle2, Loader2 } from "lucide-react";

type VerifyStep = "uploading" | "analyzing" | "resolving" | "complete";

const steps: { key: VerifyStep; label: string; icon: React.ElementType }[] = [
  { key: "uploading", label: "Uploading to Pinata", icon: Upload },
  { key: "analyzing", label: "AI Verification", icon: Brain },
  { key: "resolving", label: "Resolving on XRPL", icon: CheckCircle2 },
];

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<VerifyStep>("uploading");
  const [proofImage, setProofImage] = useState<string | null>(null);

  useEffect(() => {
    // Get proof data from sessionStorage
    const proofData = sessionStorage.getItem("proofData");
    if (proofData) {
      const parsed = JSON.parse(proofData);
      setProofImage(parsed.imageData);
    }

    // Simulate verification flow
    const timers = [
      setTimeout(() => setCurrentStep("analyzing"), 2000),
      setTimeout(() => setCurrentStep("resolving"), 4500),
      setTimeout(() => setCurrentStep("complete"), 6500),
      setTimeout(() => {
        // Navigate to result - in production, pass actual result
        router.push(`/challenge/${params.id}/result?passed=true`);
      }, 7500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [params.id, router]);

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-6">
      {/* Proof preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-48 h-48 rounded-2xl overflow-hidden mb-12 shadow-2xl"
      >
        {proofImage ? (
          <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-700 animate-pulse" />
        )}
      </motion.div>

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
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div>
                <p className={`font-medium ${isComplete || isActive ? "text-white" : "text-zinc-500"}`}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-zinc-400"
                  >
                    Processing...
                  </motion.p>
                )}
                {isComplete && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-green-400"
                  >
                    Complete
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pillar badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 mt-12"
      >
        <span className="px-3 py-1 bg-zinc-700/50 text-zinc-300 rounded-full text-xs">
          Pinata IPFS
        </span>
        <span className="px-3 py-1 bg-zinc-700/50 text-zinc-300 rounded-full text-xs">
          Gemini AI
        </span>
        <span className="px-3 py-1 bg-zinc-700/50 text-zinc-300 rounded-full text-xs">
          XRPL
        </span>
      </motion.div>
    </div>
  );
}
