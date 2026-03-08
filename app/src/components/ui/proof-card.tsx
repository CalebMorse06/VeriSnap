"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ProofCardProps {
  cid: string;
  imageUrl?: string;
  status: "private" | "revealed";
  gateway?: string;
}

export function ProofCard({ cid, imageUrl, status, gateway = "peach-random-penguin-753.mypinata.cloud" }: ProofCardProps) {
  const ipfsUrl = `https://${gateway}/ipfs/${cid}`;
  const displayCid = `${cid.slice(0, 12)}...${cid.slice(-8)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-purple-200 bg-gradient-to-br from-purple-50 to-white"
    >
      {imageUrl && (
        <div className="relative aspect-video bg-zinc-100">
          <img src={imageUrl} alt="Proof" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              status === "private" ? "bg-zinc-900/80 text-white" : "bg-green-500 text-white"
            }`}>
              {status === "private" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {status === "private" ? "Private" : "Revealed"}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            {status === "private" ? <Lock className="w-5 h-5 text-purple-600" /> : <Shield className="w-5 h-5 text-purple-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-purple-900">Pinata IPFS</p>
            <p className="text-xs text-purple-600 font-mono truncate">{displayCid}</p>
          </div>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 hover:bg-purple-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-purple-600" />
          </a>
        </div>

        <p className="text-xs text-purple-700 mt-3 leading-relaxed">
          {status === "private"
            ? "Evidence stored privately during verification. Only the AI verifier has scoped access."
            : "Evidence revealed after settlement. Immutably stored on IPFS."}
        </p>
      </div>
    </motion.div>
  );
}
