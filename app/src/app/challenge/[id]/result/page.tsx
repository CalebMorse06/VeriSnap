"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Share2, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustPillars, TrustBadge } from "@/components/ui/trust-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { VerificationTrail } from "@/components/ui/verification-trail";
import Link from "next/link";
import confetti from "canvas-confetti";
import { getChallenge, updateChallenge, type ChallengeVisibility } from "@/lib/store/challenges";
import { ShareOptions } from "@/components/challenge/ShareOptions";

interface VerificationData {
  passed: boolean;
  confidence: number;
  reasoning: string;
  proofCid?: string;
  settlementTx?: string;
}

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const challengeId = params.id as string;
  const challenge = getChallenge(challengeId);
  const passed = searchParams.get("passed") === "true";
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);

  useEffect(() => {
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
  }, [passed, challengeId]);

  const confidence = verification?.confidence ?? (passed ? 94 : 32);
  const reasoning = verification?.reasoning ?? (passed
    ? "The submitted image clearly shows the challenge objective."
    : "Unable to verify the challenge objective in the submitted image.");
  const proofCid = verification?.proofCid ?? challenge?.proofCid ?? `QmDEMO${challengeId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const settlementTx = verification?.settlementTx ?? challenge?.settlementTx ?? `TX_${challengeId}`;
  const stakeDrops = challenge?.stakeAmount ?? 20_000_000;

  return (
    <div className={`min-h-screen ${passed ? "bg-gradient-to-b from-green-50 via-white to-white" : "bg-gradient-to-b from-red-50 via-white to-white"}`}>
      {/* Back nav */}
      <div className="safe-area-inset-top px-4 py-3">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Home</span>
        </Link>
      </div>

      {/* Result header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-8 text-center px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg ${
            passed ? "bg-green-500 shadow-green-500/30" : "bg-red-500 shadow-red-500/30"
          }`}
        >
          {passed ? (
            <CheckCircle2 className="w-10 h-10 text-white" />
          ) : (
            <XCircle className="w-10 h-10 text-white" />
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-2xl font-bold mt-5 ${passed ? "text-green-700" : "text-red-700"}`}
        >
          {passed ? "Challenge Passed!" : "Challenge Failed"}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3"
        >
          <TrustBadge variant={passed ? "verified" : "private"} size="md" />
        </motion.div>
      </motion.div>

      <main className="max-w-lg mx-auto px-4 pb-10 space-y-5">
        {/* Outcome card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`overflow-hidden border-2 ${passed ? "border-green-200 bg-gradient-to-br from-green-50 to-white" : "border-red-200 bg-gradient-to-br from-red-50 to-white"}`}>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500 font-medium mb-2">
                {passed ? "Escrow Released" : "Stake Forfeited"}
              </p>
              <AmountDisplay
                drops={stakeDrops}
                variant="large"
                prefix={passed ? "+" : "-"}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Proof image */}
        {proofImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="overflow-hidden">
              <div className="relative">
                <img src={proofImage} alt="Proof" className="w-full aspect-video object-cover" />
                <div className="absolute bottom-3 left-3">
                  <TrustBadge variant="pinata" size="sm" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Verification trail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-5">
              <VerificationTrail
                proofCid={proofCid}
                escrowTxHash={challenge?.escrowTxHash}
                settlementTxHash={settlementTx}
                verification={{
                  passed,
                  confidence,
                  reasoning,
                }}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Share options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ShareOptions
            challengeId={challengeId}
            currentVisibility={challenge?.visibility ?? "private"}
            onVisibilityChange={(v: ChallengeVisibility) => updateChallenge(challengeId, { visibility: v })}
          />
        </motion.div>

        {/* Home button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Link href="/">
            <Button className="w-full gap-2 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Trust pillars footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <TrustPillars size="sm" />
        </motion.div>
      </main>
    </div>
  );
}
