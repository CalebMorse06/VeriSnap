"use client";

import { useState, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Lock } from "lucide-react";

interface SettlementPulseProps {
  amountDrops: number;
  passed: boolean;
  onCountComplete?: () => void;
}

export function SettlementPulse({ amountDrops, passed, onCountComplete }: SettlementPulseProps) {
  const xrpAmount = amountDrops / 1_000_000;
  const [pulseArrived, setPulseArrived] = useState(false);
  const [countDone, setCountDone] = useState(false);

  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const displayValue = useTransform(springValue, (v) => v.toFixed(2));

  useEffect(() => {
    if (pulseArrived) {
      springValue.set(xrpAmount);
      const unsub = springValue.on("change", (v) => {
        if (Math.abs(v - xrpAmount) < 0.01 && !countDone) {
          setCountDone(true);
          onCountComplete?.();
        }
      });
      return unsub;
    }
  }, [pulseArrived, xrpAmount, springValue, onCountComplete, countDone]);

  const color = passed ? "#22c55e" : "#dc2626";
  const bgColor = passed ? "bg-green-50" : "bg-red-50";

  return (
    <div className="flex flex-col items-center py-4">
      {/* Escrow icon */}
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-emerald-600" />
      </div>

      {/* Dotted line + pulse */}
      <div className="relative w-0.5 h-16 my-1">
        {/* Dotted track */}
        <div className="absolute inset-0 border-l-2 border-dashed border-zinc-200 ml-[-0.5px]" />

        {/* Traveling pulse */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ top: 0, opacity: 0 }}
          animate={{ top: "100%", opacity: [0, 1, 1, 0.8] }}
          transition={{ duration: 0.6, ease: "easeIn" }}
          onAnimationComplete={() => setPulseArrived(true)}
        />
      </div>

      {/* Arrival ring */}
      {pulseArrived && (
        <motion.div
          className="w-4 h-4 rounded-full border-2 mb-3"
          style={{ borderColor: color }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 3, 3], opacity: [0.6, 0.3, 0] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}

      {/* Count-up amount */}
      <div className={`px-6 py-4 rounded-xl ${bgColor} text-center`}>
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color }}>
          {passed ? "Escrow Released" : "Stake Forfeited"}
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-sm" style={{ color }}>
            {passed ? "+" : "-"}
          </span>
          <motion.span
            className="text-3xl font-semibold vs-tabular-nums"
            style={{ color }}
          >
            {displayValue}
          </motion.span>
          <span className="text-sm text-[var(--vs-text-tertiary)] ml-1">XRP</span>
        </div>
      </div>
    </div>
  );
}
