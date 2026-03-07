"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Users, Globe, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    description: "Only you can see this challenge",
    icon: Lock,
  },
  {
    value: "friends",
    label: "Share with Friends",
    description: "People with the link can view",
    icon: Users,
  },
  {
    value: "public",
    label: "Make Public",
    description: "Appears in the public feed",
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
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Share this Challenge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <motion.button
              key={option.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(option.value)}
              disabled={saving}
              className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500"
                  : "bg-zinc-50 border-2 border-transparent hover:border-zinc-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSelected ? "bg-blue-500 text-white" : "bg-zinc-200 text-zinc-600"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isSelected ? "text-blue-900" : "text-zinc-900"}`}>
                  {option.label}
                </p>
                <p className="text-sm text-zinc-500">{option.description}</p>
              </div>
              {isSelected && !saving && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
              {saving && selected === option.value && (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
            </motion.button>
          );
        })}

        {saved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-green-600 font-medium pt-2"
          >
            ✓ Visibility updated
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
