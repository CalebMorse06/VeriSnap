"use client";

import { motion } from "framer-motion";
import { Coins, Database, Brain, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface VerificationTrailProps {
  proofCid: string;
  escrowTxHash?: string;
  settlementTxHash?: string;
  verification: {
    passed: boolean;
    confidence: number;
    reasoning: string;
  };
  gateway?: string;
}

export function VerificationTrail({
  proofCid,
  escrowTxHash,
  settlementTxHash,
  verification,
  gateway = "gateway.pinata.cloud",
}: VerificationTrailProps) {
  const steps = [
    {
      icon: Database,
      title: "Proof Stored",
      subtitle: "Pinata Private IPFS",
      value: proofCid ? `${proofCid.slice(0, 10)}...` : "Pending",
      link: proofCid ? `https://${gateway}/ipfs/${proofCid}` : undefined,
      color: "purple",
      complete: Boolean(proofCid),
    },
    {
      icon: Brain,
      title: "AI Verification",
      subtitle: "Gemini 2.0 Flash",
      value: verification.passed ? `PASS (${verification.confidence}%)` : `FAIL (${verification.confidence}%)`,
      color: "blue",
      complete: verification.confidence > 0,
      status: verification.passed,
    },
    {
      icon: Coins,
      title: "Settlement",
      subtitle: "XRPL Testnet",
      value: settlementTxHash ? `${settlementTxHash.slice(0, 10)}...` : "Pending",
      link: settlementTxHash ? `https://testnet.xrpl.org/transactions/${settlementTxHash}` : undefined,
      color: "emerald",
      complete: Boolean(settlementTxHash),
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", icon: "text-purple-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: "text-emerald-600" },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        Verification Trail
      </h3>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const colors = colorMap[step.color];
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center ${colors.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${colors.text}`}>{step.title}</p>
                    {step.complete && (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        "status" in step
                          ? step.status
                            ? "bg-green-500"
                            : "bg-red-500"
                          : "bg-green-500"
                      }`}>
                        {("status" in step && !step.status) ? (
                          <XCircle className="w-3 h-3 text-white" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{step.subtitle}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <p className={`text-xs font-mono ${colors.text}`}>{step.value}</p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-6 h-6 rounded flex items-center justify-center hover:bg-white/50 transition-colors ${colors.icon}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {verification.reasoning && (
        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
          <p className="text-xs text-zinc-500 font-medium mb-1">AI Reasoning</p>
          <p className="text-sm text-zinc-700">{verification.reasoning}</p>
        </div>
      )}
    </div>
  );
}
