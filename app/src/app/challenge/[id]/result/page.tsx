"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ExternalLink, Share2, Home, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const passed = searchParams.get("passed") === "true";
  const [proofImage, setProofImage] = useState<string | null>(null);

  useEffect(() => {
    // Get proof from session
    const proofData = sessionStorage.getItem("proofData");
    if (proofData) {
      const parsed = JSON.parse(proofData);
      setProofImage(parsed.imageData);
    }

    // Confetti on success
    if (passed) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 500);
    }
  }, [passed]);

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
          className="text-zinc-600 mt-2"
        >
          {passed 
            ? "Your proof was verified successfully" 
            : "The AI could not verify your submission"}
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
                    {passed ? "Reward Earned" : "Stake Forfeited"}
                  </p>
                  <p className="text-2xl font-bold">
                    {passed ? "+10.00 XRP" : "-10.00 XRP"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-zinc-900">Verification Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Challenge</span>
                  <span className="text-zinc-900">Visit the KU Campanile</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">AI Confidence</span>
                  <span className={passed ? "text-green-600" : "text-red-600"}>
                    {passed ? "94%" : "32%"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Proof CID</span>
                  <span className="text-zinc-900 font-mono text-xs">QmX7f9...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">XRPL Tx</span>
                  <a 
                    href="#" 
                    className="text-blue-600 flex items-center gap-1 text-xs"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
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
            Share
          </Button>
          <Link href="/" className="flex-1">
            <Button className="w-full gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
