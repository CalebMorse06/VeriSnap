"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Database, Cpu, Lock, CheckCircle2, Loader2 } from "lucide-react";

type PipelineStep = "uploading" | "analyzing" | "resolving" | "complete" | "error";

interface ProofPipelineProps {
  currentStep: PipelineStep;
  result?: { passed: boolean; confidence: number };
}

const nodes = [
  { key: "uploading" as const, label: "Uploading Proof", sublabel: "Private IPFS via Pinata", Icon: Database },
  { key: "analyzing" as const, label: "AI Verification", sublabel: "Gemini 2.0 Flash", Icon: Cpu },
  { key: "resolving" as const, label: "Settlement", sublabel: "XRPL EscrowFinish", Icon: Lock },
];

const stepOrder: PipelineStep[] = ["uploading", "analyzing", "resolving", "complete"];

function getStepIndex(step: PipelineStep): number {
  return stepOrder.indexOf(step);
}

export function ProofPipeline({ currentStep }: ProofPipelineProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="relative flex flex-col items-center gap-0">
      {nodes.map((node, i) => {
        const nodeIndex = getStepIndex(node.key);
        const isActive = nodeIndex === currentIndex;
        const isComplete = nodeIndex < currentIndex || currentStep === "complete";
        const isInactive = !isActive && !isComplete;

        return (
          <div key={node.key} className="flex flex-col items-center">
            {/* Connecting line above (except first) */}
            {i > 0 && (
              <div className="relative w-0.5 h-8 bg-zinc-200 overflow-hidden">
                <motion.div
                  className="absolute inset-x-0 top-0 bg-emerald-500 origin-top"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: isComplete || isActive ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ height: "100%" }}
                />
              </div>
            )}

            {/* Node */}
            <div className="relative flex items-center gap-4">
              {/* Circle */}
              <div className="relative">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isComplete
                      ? "bg-green-500"
                      : isActive
                      ? "bg-emerald-600"
                      : "bg-zinc-200"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isActive && !isComplete ? (
                      <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </motion.div>
                    ) : isComplete ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : (
                      <node.Icon className="w-5 h-5 text-zinc-400" />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Pulse ring for active */}
                {isActive && !isComplete && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-400"
                    animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>

              {/* Label */}
              <div className="w-40">
                <p
                  className={`font-medium text-sm ${
                    isInactive ? "text-[var(--vs-text-tertiary)]" : "text-[var(--vs-text-primary)]"
                  }`}
                >
                  {node.label}
                </p>
                <p
                  className={`text-xs ${
                    isComplete ? "text-green-600" : isActive ? "text-emerald-600" : "text-[var(--vs-text-tertiary)]"
                  }`}
                >
                  {isComplete ? "Complete" : isActive ? "Processing..." : node.sublabel}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
