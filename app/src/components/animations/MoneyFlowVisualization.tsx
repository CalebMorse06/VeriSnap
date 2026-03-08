"use client";

import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { animation } from "@/styles/design-tokens";

export interface MoneyFlowVisualizationProps {
  flowState: "idle" | "funding" | "locked" | "settling" | "complete" | "failed";
  amountXrp: number;
  creatorAddress?: string;
  winnerAddress?: string;
  txHash?: string;
  compact?: boolean;
}

const COIN_COUNT = 4;
const STAGGER = 0.15;

function truncAddr(addr?: string) {
  if (!addr) return "---";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
}

function CoinStream({
  direction,
  color,
  active,
  compact,
}: {
  direction: "right" | "left";
  color: string;
  active: boolean;
  compact?: boolean;
}) {
  const pathWidth = compact ? 60 : 90;
  return (
    <AnimatePresence>
      {active &&
        Array.from({ length: COIN_COUNT }).map((_, i) => (
          <motion.circle
            key={`coin-${direction}-${i}`}
            r={compact ? 3.5 : 4.5}
            fill={color}
            initial={{
              cx: direction === "right" ? 0 : pathWidth,
              cy: 0,
              opacity: 0,
            }}
            animate={{
              cx: direction === "right" ? pathWidth : 0,
              cy: [0, -6, 0],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              delay: i * STAGGER,
              ease: "easeInOut",
            }}
          />
        ))}
    </AnimatePresence>
  );
}

function CountUpAmount({ amount, color }: { amount: number; color: string }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => v.toFixed(1));

  // Trigger count-up
  spring.set(amount);

  return (
    <motion.tspan fill={color} className="vs-tabular-nums">
      {display}
    </motion.tspan>
  );
}

export function MoneyFlowVisualization({
  flowState,
  amountXrp,
  creatorAddress,
  winnerAddress,
  txHash,
  compact = false,
}: MoneyFlowVisualizationProps) {
  const w = compact ? 280 : 360;
  const h = compact ? 100 : 130;
  const nodeR = compact ? 18 : 24;
  const vaultW = compact ? 36 : 48;
  const vaultH = compact ? 28 : 36;
  const cx = w / 2;
  const leftX = compact ? 36 : 50;
  const rightX = w - leftX;
  const midY = compact ? 40 : 50;

  const stateColor =
    flowState === "failed"
      ? "#dc2626"
      : flowState === "complete"
      ? "#22c55e"
      : "#059669";

  const rightPathColor = flowState === "failed" ? "#fca5a5" : "#d4d4d8";

  return (
    <div className="flex flex-col items-center w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ maxWidth: w }}
      >
        {/* Left dashed track */}
        <line
          x1={leftX + nodeR + 4}
          y1={midY}
          x2={cx - vaultW / 2 - 4}
          y2={midY}
          stroke="#d4d4d8"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Right dashed track */}
        <line
          x1={cx + vaultW / 2 + 4}
          y1={midY}
          x2={rightX - nodeR - 4}
          y2={midY}
          stroke={rightPathColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Left wallet node */}
        <motion.circle
          cx={leftX}
          cy={midY}
          r={nodeR}
          fill="none"
          stroke={flowState === "idle" ? "#a1a1aa" : "#059669"}
          strokeWidth="2"
          animate={{
            stroke: flowState === "idle" ? "#a1a1aa" : "#059669",
          }}
        />
        <text
          x={leftX}
          y={midY + 1}
          textAnchor="middle"
          fontSize={compact ? 9 : 11}
          fill={flowState === "idle" ? "#a1a1aa" : "#059669"}
          fontWeight="600"
        >
          W
        </text>

        {/* Center vault */}
        <motion.rect
          x={cx - vaultW / 2}
          y={midY - vaultH / 2}
          width={vaultW}
          height={vaultH}
          rx="6"
          fill="none"
          stroke={stateColor}
          strokeWidth="2.5"
          animate={{
            stroke: stateColor,
            opacity:
              flowState === "idle" ? 0.4 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Vault lock icon */}
        <AnimatePresence>
          {(flowState === "locked" ||
            flowState === "settling" ||
            flowState === "complete" ||
            flowState === "failed") && (
            <motion.g
              initial={{ scale: 0, originX: `${cx}px`, originY: `${midY}px` }}
              animate={{ scale: 1 }}
              transition={animation.springBouncy}
            >
              <rect
                x={cx - 5}
                y={midY - 2}
                width="10"
                height="8"
                rx="1.5"
                fill={stateColor}
              />
              <path
                d={`M ${cx - 3} ${midY - 2} L ${cx - 3} ${midY - 5} A 3 3 0 0 1 ${cx + 3} ${midY - 5} L ${cx + 3} ${midY - 2}`}
                fill="none"
                stroke={stateColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Right wallet node */}
        <motion.circle
          cx={rightX}
          cy={midY}
          r={nodeR}
          fill="none"
          stroke={
            flowState === "complete"
              ? "#22c55e"
              : flowState === "failed"
              ? "#dc2626"
              : "#a1a1aa"
          }
          strokeWidth="2"
          animate={{
            stroke:
              flowState === "complete"
                ? "#22c55e"
                : flowState === "failed"
                ? "#dc2626"
                : "#a1a1aa",
          }}
        />
        <text
          x={rightX}
          y={midY + 1}
          textAnchor="middle"
          fontSize={compact ? 9 : 11}
          fill={
            flowState === "complete"
              ? "#22c55e"
              : flowState === "failed"
              ? "#dc2626"
              : "#a1a1aa"
          }
          fontWeight="600"
        >
          W
        </text>

        {/* Complete checkmark on winner */}
        <AnimatePresence>
          {flowState === "complete" && (
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={animation.springBouncy}
            >
              <circle cx={rightX + nodeR * 0.6} cy={midY - nodeR * 0.6} r="6" fill="#22c55e" />
              <path
                d={`M ${rightX + nodeR * 0.6 - 3} ${midY - nodeR * 0.6} l 2 2 4 -4`}
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Funding coins: left -> center */}
        <g
          transform={`translate(${leftX + nodeR + 4}, ${midY})`}
        >
          <CoinStream
            direction="right"
            color="#10b981"
            active={flowState === "funding"}
            compact={compact}
          />
        </g>

        {/* Settling coins: center -> right */}
        <g
          transform={`translate(${cx + vaultW / 2 + 4}, ${midY})`}
        >
          <CoinStream
            direction={flowState === "failed" ? "left" : "right"}
            color={flowState === "failed" ? "#dc2626" : "#22c55e"}
            active={flowState === "settling" || flowState === "failed"}
            compact={compact}
          />
        </g>

        {/* Labels below nodes */}
        <text
          x={leftX}
          y={midY + nodeR + (compact ? 12 : 16)}
          textAnchor="middle"
          fontSize={compact ? 7 : 9}
          fill="#a1a1aa"
          fontFamily="monospace"
        >
          {truncAddr(creatorAddress)}
        </text>
        <text
          x={rightX}
          y={midY + nodeR + (compact ? 12 : 16)}
          textAnchor="middle"
          fontSize={compact ? 7 : 9}
          fill="#a1a1aa"
          fontFamily="monospace"
        >
          {truncAddr(winnerAddress)}
        </text>

        {/* Amount below vault */}
        <text
          x={cx}
          y={midY + vaultH / 2 + (compact ? 12 : 16)}
          textAnchor="middle"
          fontSize={compact ? 10 : 12}
          fontWeight="600"
        >
          <tspan fill={stateColor}>{amountXrp}</tspan>
          <tspan fill="#a1a1aa" fontSize={compact ? 8 : 9}>
            {" "}
            XRP
          </tspan>
        </text>
      </svg>

      {/* Glow pulse when locked */}
      {flowState === "locked" && (
        <motion.div
          className="w-12 h-1 rounded-full mx-auto -mt-2"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(16, 185, 129, 0)",
              "0 0 12px 3px rgba(16, 185, 129, 0.2)",
              "0 0 0 0 rgba(16, 185, 129, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* State label */}
      <p className="text-xs text-[var(--vs-text-tertiary)] mt-1 text-center">
        {flowState === "idle" && "Ready"}
        {flowState === "funding" && "Funding escrow..."}
        {flowState === "locked" && "Locked in escrow"}
        {flowState === "settling" && "Settling payout..."}
        {flowState === "complete" && "Payout complete"}
        {flowState === "failed" && "Stake returned"}
      </p>
    </div>
  );
}
