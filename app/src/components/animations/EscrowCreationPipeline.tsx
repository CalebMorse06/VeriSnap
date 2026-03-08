"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Lock, CheckCircle2, Loader2, XCircle } from "lucide-react";

type CreationStep = "connecting" | "creating" | "confirming" | "success" | "error";

interface EscrowCreationPipelineProps {
  currentStep: CreationStep;
  txHash?: string;
  errorMessage?: string;
}

const nodes = [
  { key: "connecting" as const, label: "Connecting to XRPL", sublabel: "Testnet ledger", Icon: Wifi },
  { key: "creating" as const, label: "Creating Escrow", sublabel: "EscrowCreate transaction", Icon: Lock },
  { key: "confirming" as const, label: "Confirmed", sublabel: "On-chain", Icon: CheckCircle2 },
];

const stepOrder: CreationStep[] = ["connecting", "creating", "confirming", "success"];

function getStepIndex(step: CreationStep): number {
  if (step === "error") return -1;
  return stepOrder.indexOf(step);
}

export function EscrowCreationPipeline({ currentStep, txHash, errorMessage }: EscrowCreationPipelineProps) {
  const currentIndex = getStepIndex(currentStep);

  // Find which node is errored (for error state, it's the last active one)
  const errorAtIndex = currentStep === "error" ? Math.max(0, currentIndex) : -1;

  return (
    <div className="relative flex flex-col items-center gap-0 py-2">
      {nodes.map((node, i) => {
        const nodeIndex = i;
        const isError = currentStep === "error" && i === errorAtIndex;
        const isActive = !isError && nodeIndex === currentIndex;
        const isComplete = !isError && (nodeIndex < currentIndex || currentStep === "success");
        const isInactive = !isActive && !isComplete && !isError;

        return (
          <div key={node.key} className="flex flex-col items-center">
            {/* Connecting line above (except first) */}
            {i > 0 && (
              <div className="relative w-0.5 h-8 bg-zinc-200 overflow-hidden">
                <motion.div
                  className={`absolute inset-x-0 top-0 origin-top ${isError && i <= errorAtIndex + 1 ? "bg-red-500" : "bg-emerald-500"}`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: isComplete || isActive || (isError && i <= errorAtIndex + 1) ? 1 : 0 }}
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
                    isError
                      ? "bg-red-500"
                      : isComplete
                      ? "bg-green-500"
                      : isActive
                      ? "bg-emerald-600"
                      : "bg-zinc-200"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isError ? (
                      <motion.div
                        key="error"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <XCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : isActive && !isComplete ? (
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
              <div className="w-48">
                <p
                  className={`font-medium text-sm ${
                    isError
                      ? "text-red-700"
                      : isInactive
                      ? "text-[var(--vs-text-tertiary)]"
                      : "text-[var(--vs-text-primary)]"
                  }`}
                >
                  {node.label}
                </p>
                <p
                  className={`text-xs ${
                    isError
                      ? "text-red-500"
                      : isComplete
                      ? "text-green-600"
                      : isActive
                      ? "text-emerald-600"
                      : "text-[var(--vs-text-tertiary)]"
                  }`}
                >
                  {isError
                    ? "Failed"
                    : isComplete
                    ? "Complete"
                    : isActive
                    ? "Processing..."
                    : node.sublabel}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Tx hash link on success */}
      {currentStep === "success" && txHash && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center"
        >
          <a
            href={`https://testnet.xrpl.org/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 hover:text-emerald-700 underline underline-offset-2 font-mono"
          >
            {txHash.slice(0, 8)}...{txHash.slice(-8)}
          </a>
        </motion.div>
      )}

      {/* Error message */}
      {currentStep === "error" && errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs text-red-600 text-center max-w-[240px]"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
}
