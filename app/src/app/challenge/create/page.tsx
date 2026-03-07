"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Clock, AlertCircle, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import Link from "next/link";
import { createChallenge, updateChallenge } from "@/lib/store/challenges";

// Preset challenges for quick demo
const PRESETS = [
  {
    id: "campanile",
    name: "KU Campanile",
    title: "Visit the KU Campanile",
    description: "Prove you're at the iconic KU Campanile bell tower.",
    objective: "Take a clear photo showing the KU Campanile bell tower",
    location: { name: "KU Campanile, Lawrence, KS", lat: 38.9543, lng: -95.2558 },
    stakeAmount: 20,
    durationMinutes: 20,
  },
  {
    id: "coffee",
    name: "Coffee Run",
    title: "Get a Coffee",
    description: "Prove you bought a coffee from a local coffee shop.",
    objective: "Take a photo of your coffee cup with the shop logo visible",
    location: { name: "Any local coffee shop", lat: 0, lng: 0 },
    stakeAmount: 5,
    durationMinutes: 30,
  },
  {
    id: "workout",
    name: "Gym Check-in",
    title: "Hit the Gym",
    description: "Prove you made it to the gym for a workout.",
    objective: "Take a photo inside the gym showing equipment or your workout area",
    location: { name: "Your local gym", lat: 0, lng: 0 },
    stakeAmount: 10,
    durationMinutes: 60,
  },
];

export default function CreateChallengePage() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState<string | null>("campanile");
  const [isCustom, setIsCustom] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [locationName, setLocationName] = useState("");
  const [stakeAmount, setStakeAmount] = useState(10);
  const [duration, setDuration] = useState(20);

  const preset = PRESETS.find(p => p.id === selectedPreset);

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const data = isCustom ? {
        title: title || "Custom Challenge",
        description: description || "Complete this challenge",
        objective: objective || "Submit photo proof",
        location: { name: locationName || "Specified location", lat: 0, lng: 0 },
        stakeAmount: stakeAmount * 1_000_000,
        durationMinutes: duration,
        creatorAddress: "rDemoUser",
      } : {
        title: preset!.title,
        description: preset!.description,
        objective: preset!.objective,
        location: preset!.location,
        stakeAmount: preset!.stakeAmount * 1_000_000,
        durationMinutes: preset!.durationMinutes,
        creatorAddress: "rDemoUser",
      };

      const challenge = createChallenge(data);

      // Create real XRPL escrow on backend
      const escrowResp = await fetch("/api/challenge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          objective: data.objective,
          location: data.location,
          stakeAmountXrp: data.stakeAmount / 1_000_000,
          durationMinutes: data.durationMinutes,
        }),
      });

      const escrowData = await escrowResp.json();
      if (!escrowResp.ok || !escrowData.success) {
        throw new Error(escrowData.error || "Failed to create XRPL escrow");
      }

      // Persist escrow details for settlement step
      updateChallenge(challenge.id, {
        escrowTxHash: escrowData.escrowTxHash,
        escrowSequence: escrowData.escrowSequence,
        escrowOwner: escrowData.escrowOwner,
      });

      router.push(`/challenge/${challenge.id}`);
    } catch (error) {
      console.error("Failed to create challenge:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">New Challenge</h1>
            <p className="text-xs text-[var(--vs-text-tertiary)]">Create and lock stake</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Presets */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--vs-text-secondary)] uppercase tracking-wide mb-3">
            Quick Start
          </h2>
          <div className="space-y-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPreset(p.id);
                  setIsCustom(false);
                }}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  selectedPreset === p.id && !isCustom
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-[var(--vs-border)] hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--vs-text-primary)]">{p.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--vs-text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {p.location.name.split(",")[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {p.durationMinutes}m
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-[var(--vs-text-primary)]">{p.stakeAmount}</span>
                    <span className="text-xs text-[var(--vs-text-tertiary)] ml-1">XRP</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Custom toggle */}
        <section className="mb-6">
          <button
            onClick={() => {
              setIsCustom(true);
              setSelectedPreset(null);
            }}
            className={`w-full p-4 rounded-xl text-left transition-all border border-dashed ${
              isCustom
                ? "bg-emerald-50 border-emerald-300"
                : "bg-white border-zinc-300 hover:border-zinc-400"
            }`}
          >
            <p className="font-medium text-[var(--vs-text-primary)]">Create Custom</p>
            <p className="text-xs text-[var(--vs-text-tertiary)] mt-0.5">Define your own challenge</p>
          </button>
        </section>

        {/* Custom form */}
        {isCustom && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">Title</label>
              <Input 
                placeholder="e.g., Visit the Library"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border-[var(--vs-border)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">Description</label>
              <Input 
                placeholder="What is this challenge about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border-[var(--vs-border)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">Proof Objective</label>
              <Input 
                placeholder="What should the photo show?"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="rounded-lg border-[var(--vs-border)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">Location</label>
              <Input 
                placeholder="Where should they go?"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="rounded-lg border-[var(--vs-border)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">Stake (XRP)</label>
                <Input 
                  type="number"
                  min={1}
                  max={1000}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseInt(e.target.value) || 10)}
                  className="rounded-lg border-[var(--vs-border)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">Time Limit</label>
                <Input 
                  type="number"
                  min={5}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 20)}
                  className="rounded-lg border-[var(--vs-border)]"
                />
              </div>
            </div>
          </motion.section>
        )}

        {/* Escrow info */}
        <section className="mb-6 p-4 rounded-xl bg-white border border-[var(--vs-border)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-[var(--vs-text-primary)]">XRPL Escrow</p>
                <TrustBadge variant="xrpl" size="sm" animated={false} />
              </div>
              <p className="text-sm text-[var(--vs-text-secondary)] leading-relaxed">
                Stake locks in an on-chain escrow. Settlement is automatic based on AI verification.
              </p>
            </div>
          </div>
        </section>

        {/* Demo notice */}
        <section className="mb-6">
          <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Demo Mode:</strong> Uses XRPL Testnet. No real XRP transferred.
            </p>
          </div>
        </section>

        {/* Create button */}
        <section>
          <Button
            size="lg"
            className="w-full h-12 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={handleCreate}
            disabled={isCreating || (!preset && !isCustom)}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Escrow...
              </>
            ) : (
              <>
                Create Challenge
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-[var(--vs-text-tertiary)] mt-3">
            Stake will be locked until challenge resolves
          </p>
        </section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
