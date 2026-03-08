"use client";

import { motion, AnimatePresence } from "framer-motion";
import { animation } from "@/styles/design-tokens";

interface EscrowLockAnimationProps {
  amountXrp: number;
  state: "idle" | "funding" | "locked";
  onComplete?: () => void;
}

const coinPaths = [
  { startX: -40, startY: -30, cx: -20, cy: -40 },
  { startX: 40, startY: -25, cx: 20, cy: -35 },
  { startX: -35, startY: 35, cx: -15, cy: 20 },
  { startX: 45, startY: 30, cx: 25, cy: 15 },
];

export function EscrowLockAnimation({ amountXrp, state, onComplete }: EscrowLockAnimationProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[120px] h-[120px]">
        <svg viewBox="-60 -60 120 120" className="w-full h-full">
          {/* Vault body */}
          <motion.rect
            x="-32"
            y="-32"
            width="64"
            height="64"
            rx="8"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            initial={{ opacity: 0.4 }}
            animate={{
              opacity: state === "idle" ? 0.4 : 1,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Vault inner circle */}
          <motion.circle
            cx="0"
            cy="0"
            r="16"
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: state === "idle" ? 0.3 : 0.6,
            }}
          />

          {/* Funding coins */}
          <AnimatePresence>
            {state === "funding" &&
              coinPaths.map((path, i) => (
                <motion.circle
                  key={`coin-${i}`}
                  r="5"
                  fill="#10b981"
                  initial={{ cx: path.startX, cy: path.startY, opacity: 0 }}
                  animate={{
                    cx: [path.startX, path.cx, 0],
                    cy: [path.startY, path.cy, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
          </AnimatePresence>

          {/* Vault door */}
          <motion.g
            initial={{ rotate: 0 }}
            animate={{
              rotate: state === "locked" ? -95 : 0,
            }}
            transition={animation.spring}
            style={{ originX: "-32px", originY: "0px" }}
          >
            <motion.line
              x1="-32"
              y1="-20"
              x2="-32"
              y2="20"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{
                opacity: state === "idle" ? 0 : 1,
              }}
            />
          </motion.g>

          {/* Lock icon */}
          <AnimatePresence>
            {state === "locked" && (
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={animation.springBouncy}
                onAnimationComplete={onComplete}
              >
                {/* Lock body */}
                <rect x="-8" y="-2" width="16" height="12" rx="2" fill="#059669" />
                {/* Lock shackle */}
                <path
                  d="M -5 -2 L -5 -7 A 5 5 0 0 1 5 -7 L 5 -2"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* Glow pulse when locked */}
        {state === "locked" && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0)",
                "0 0 20px 4px rgba(16, 185, 129, 0.15)",
                "0 0 0 0 rgba(16, 185, 129, 0)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Amount label */}
      <div className="text-center">
        <span className="text-lg font-semibold text-[var(--vs-text-primary)] vs-tabular-nums">
          {amountXrp}
        </span>
        <span className="text-sm text-[var(--vs-text-tertiary)] ml-1.5">XRP</span>
        {state === "locked" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-emerald-600 mt-0.5"
          >
            Locked in escrow
          </motion.p>
        )}
      </div>
    </div>
  );
}
