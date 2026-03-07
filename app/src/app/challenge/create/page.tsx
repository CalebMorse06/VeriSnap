"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Clock, Zap, Sparkles, AlertCircle, Lock, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { Badge } from "@/components/ui/badge";
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
    emoji: "🔔",
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
    emoji: "☕",
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
    emoji: "💪",
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
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Create Challenge</h1>
            <p className="text-xs text-zinc-500">Set up a new VeriSnap challenge</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Quick presets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Quick Presets
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPreset(p.id);
                  setIsCustom(false);
                }}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedPreset === p.id && !isCustom
                    ? "bg-blue-100 border-2 border-blue-500"
                    : "bg-white border-2 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <p className="text-xs font-medium text-zinc-700 mt-1">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.stakeAmount} XRP</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Selected preset details */}
        {preset && !isCustom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{preset.title}</h3>
                    <p className="text-sm text-zinc-600">{preset.description}</p>
                  </div>
                  <Badge className="bg-green-500">Ready</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <MapPin className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-zinc-500 truncate">{preset.location.name.split(",")[0]}</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                    <p className="text-xs text-zinc-500">{preset.durationMinutes} min</p>
                  </div>
                  <div className="text-center">
                    <Coins className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-zinc-500">{preset.stakeAmount} XRP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Or create custom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <button
            onClick={() => {
              setIsCustom(true);
              setSelectedPreset(null);
            }}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              isCustom
                ? "bg-blue-100 border-2 border-blue-500"
                : "bg-white border-2 border-dashed border-zinc-300 hover:border-zinc-400"
            }`}
          >
            <p className="font-medium text-zinc-700">✨ Create Custom Challenge</p>
            <p className="text-sm text-zinc-500">Define your own objective and stake</p>
          </button>
        </motion.div>

        {/* Custom form */}
        {isCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4 mb-6"
          >
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Challenge Title</label>
              <Input 
                placeholder="e.g., Visit the Library"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Description</label>
              <Input 
                placeholder="What is this challenge about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Proof Objective</label>
              <Input 
                placeholder="What should the photo show?"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Location</label>
              <Input 
                placeholder="Where should they go?"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1">Stake (XRP)</label>
                <Input 
                  type="number"
                  min={1}
                  max={1000}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseInt(e.target.value) || 10)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1">Duration (min)</label>
                <Input 
                  type="number"
                  min={5}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 20)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* XRPL callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-emerald-900">XRPL Escrow</p>
                    <TrustBadge variant="xrpl" size="sm" animated={false} />
                  </div>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    Stake locks in an on-chain escrow contract. Settlement is automatic and trustless based on Gemini AI verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              <strong>Demo Mode:</strong> No real XRP will be transferred. This uses XRPL Testnet for demonstration.
            </p>
          </div>
        </motion.div>

        {/* Create button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            className="w-full text-lg h-14 gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20"
            onClick={handleCreate}
            disabled={isCreating || (!preset && !isCustom)}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating XRPL Escrow...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Create & Lock Stake
              </>
            )}
          </Button>
          <p className="text-center text-xs text-zinc-500 mt-3">
            Stake will be locked in XRPL escrow until challenge resolves
          </p>
        </motion.div>

        {/* Trust footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="pt-4"
        >
          <TrustPillars size="sm" />
        </motion.div>
      </main>
    </div>
  );
}
