"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

interface ProofRevealProps {
  imageUrl: string;
  state: "locked" | "revealing" | "revealed";
  onRevealComplete?: () => void;
}

export function ProofReveal({ imageUrl, state, onRevealComplete }: ProofRevealProps) {
  const isLocked = state === "locked";
  const isRevealing = state === "revealing";

  return (
    <motion.div
      className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--vs-border)]"
      animate={{ scale: state === "revealed" ? [1.01, 1] : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt="Proof"
        className="w-full h-full object-cover"
      />

      {/* Blur overlay (separate div for perf) */}
      <motion.div
        className="absolute inset-0"
        style={{ willChange: "filter, opacity", backdropFilter: "blur(20px)" }}
        animate={{
          backdropFilter: isLocked ? "blur(20px)" : isRevealing ? "blur(0px)" : "blur(0px)",
          opacity: isLocked ? 1 : isRevealing ? 0 : 0,
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Brightness darken */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: isLocked ? 0.3 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* Scan line */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Lock overlay content */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            <motion.div
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Lock className="w-8 h-8 text-white mb-2" />
            </motion.div>
            <motion.p
              className="text-white text-sm font-medium"
              exit={{ opacity: 0 }}
            >
              Proof Secured
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash on reveal */}
      <AnimatePresence>
        {isRevealing && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
