"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Users, Globe, Check, Loader2 } from "lucide-react";
import type { ChallengeVisibility } from "@/lib/store/challenges";

interface ShareOptionsProps {
  challengeId: string;
  currentVisibility: ChallengeVisibility;
  onVisibilityChange?: (visibility: ChallengeVisibility) => void;
}

const options: { value: ChallengeVisibility; label: string; description: string; icon: typeof Lock }[] = [
  {
    value: "private",
    label: "Keep Private",
    description: "Only you can see this",
    icon: Lock,
  },
  {
    value: "friends",
    label: "Share Link",
    description: "Anyone with the link",
    icon: Users,
  },
  {
    value: "public",
    label: "Make Public",
    description: "Show in public feed",
    icon: Globe,
  },
];

export function ShareOptions({ challengeId, currentVisibility, onVisibilityChange }: ShareOptionsProps) {
  const [selected, setSelected] = useState<ChallengeVisibility>(currentVisibility);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (visibility: ChallengeVisibility) => {
    if (visibility === selected || saving) return;

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/challenges/${challengeId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });

      const json = await res.json();
      if (json.success) {
        setSelected(visibility);
        setSaved(true);
        onVisibilityChange?.(visibility);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to update visibility:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white border border-[var(--vs-border)]">
      <h3 className="text-sm font-medium text-[var(--vs-text-primary)] mb-3">Share this Challenge</h3>
      
      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <motion.button
              key={option.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(option.value)}
              disabled={saving}
              className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-zinc-50 border border-transparent hover:border-zinc-200"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isSelected ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isSelected ? "text-emerald-900" : "text-[var(--vs-text-primary)]"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-[var(--vs-text-tertiary)]">{option.description}</p>
              </div>
              {isSelected && !saving && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
              {saving && selected === option.value && (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              )}
            </motion.button>
          );
        })}
      </div>

      {saved && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-green-600 font-medium mt-3"
        >
          ✓ Updated
        </motion.p>
      )}
    </div>
  );
}
