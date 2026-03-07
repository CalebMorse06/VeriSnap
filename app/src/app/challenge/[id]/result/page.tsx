"use client";

import { useParams, useSearchParams } from "next/navigation";
import { getChallenge, updateChallenge } from "@/lib/store/challenges";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ExternalLink, Share2, Home, Coins, Shield, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import confetti from "canvas-confetti";

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

    // Get proof from session
    const proofData = sessionStorage.getItem("proofData");
    if (proofData) {
      const parsed = JSON.parse(proofData);
      setProofImage(parsed.imageData);
    }

    // Get verification result
    const verificationResult = sessionStorage.getItem("verificationResult");
    if (verificationResult) {
      setVerification(JSON.parse(verificationResult));
    }

    // Confetti on success
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
  const settlementTx = verification?.settlementTx ?? challenge?.settlementTx ?? `DEMO_TX_${challengeId}`;
  const stakeXrp = ((challenge?.stakeAmount ?? 20_000_000) / 1_000_000).toFixed(2);

  return (
    <div className={`min-h-screen ${passed ? "bg-gradient-to-b from-green-50 to-white" : "bg-gradient-to-b from-red-50 to-white"}`}>
      {/* Result header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${passed ? "bg-green-500" : "bg-red-500"}`}
        >
          {passed ? (
            <CheckCircle2 className="w-12 h-12 text-white" />
          ) : (
            <XCircle className="w-12 h-12 text-white" />
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-3xl font-bold mt-6 ${passed ? "text-green-700" : "text-red-700"}`}
        >
          {passed ? "Challenge Passed!" : "Challenge Failed"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-600 mt-2 max-w-sm mx-auto px-4"
        >
          {reasoning}
        </motion.p>
      </motion.div>

      <main className="max-w-lg mx-auto px-4 pb-8 space-y-6">
        {/* Proof image */}
        {proofImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden">
              <img src={proofImage} alt="Proof" className="w-full aspect-video object-cover" />
            </Card>
          </motion.div>
        )}

        {/* XRP Outcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={passed ? "bg-green-900" : "bg-red-900"}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${passed ? "bg-green-700" : "bg-red-700"}`}>
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-sm opacity-80">
                    {passed ? "Escrow Released" : "Escrow Forfeited"}
                  </p>
                  <p className="text-2xl font-bold">
                    {passed ? `+${stakeXrp} XRP` : `-${stakeXrp} XRP`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Three pillars verification details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-zinc-900">Verification Trail</h3>
              
              {/* Gemini */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">Gemini AI Verdict</p>
                  <p className={`text-lg font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                    {passed ? "PASS" : "FAIL"} — {confidence}% confidence
                  </p>
                </div>
              </div>

              {/* Pinata */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileImage className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-900">Pinata Proof CID</p>
                  <p className="text-sm font-mono text-purple-700 truncate">{proofCid}</p>
                </div>
              </div>

              {/* XRPL */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900">XRPL Settlement</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-green-700 truncate">{settlementTx}</p>
                    <a 
                      href={`https://testnet.xrpl.org/transactions/${settlementTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          <Button variant="outline" className="flex-1 gap-2">
            <Share2 className="w-4 h-4" />
            Share Result
          </Button>
          <Link href="/" className="flex-1">
            <Button className="w-full gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </motion.div>

        {/* Tech stack footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-zinc-400">
            Powered by <span className="text-zinc-600">XRPL</span> · <span className="text-zinc-600">Pinata</span> · <span className="text-zinc-600">Gemini</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
