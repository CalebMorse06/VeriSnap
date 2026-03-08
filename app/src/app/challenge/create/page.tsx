"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Clock, Lock, ArrowRight, RotateCcw, ExternalLink, User, Users, Globe, Wand2, Shield, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { EscrowCreationPipeline } from "@/components/animations/EscrowCreationPipeline";
import { EscrowLockAnimation } from "@/components/animations/EscrowLockAnimation";
import { MoneyFlowVisualization } from "@/components/animations/MoneyFlowVisualization";
import { ServiceStatus } from "@/components/status/ServiceStatus";
import Link from "next/link";
import { createChallenge, updateChallenge } from "@/lib/store/challenges";
import { useWallet } from "@/lib/wallet-context";

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

type CreationStep = "idle" | "connecting" | "creating" | "confirming" | "success" | "error";

export default function CreateChallengePage() {
  const router = useRouter();
  const wallet = useWallet();
  const [selectedPreset, setSelectedPreset] = useState<string | null>("campanile");
  const [isCustom, setIsCustom] = useState(false);
  const [challengeMode, setChallengeMode] = useState<"self" | "versus" | "bounty">("self");
  const [creationStep, setCreationStep] = useState<CreationStep>("idle");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [escrowImgError, setEscrowImgError] = useState(false);
  const [escrowResult, setEscrowResult] = useState<{ txHash: string; sequence: number; challengeId: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [locationName, setLocationName] = useState("");
  const [stakeAmount, setStakeAmount] = useState(10);
  const [duration, setDuration] = useState(20);
  const [opponentAddress, setOpponentAddress] = useState("");

  // AI expand state
  const [expanding, setExpanding] = useState(false);
  const [aiSuggested, setAiSuggested] = useState<Set<string>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);

  const preset = PRESETS.find(p => p.id === selectedPreset);

  const handleCreate = async () => {
    setCreationStep("connecting");
    setCreationError(null);
    setEscrowResult(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const data = isCustom ? {
        title: title || "Custom Challenge",
        description: description || "Complete this challenge",
        objective: objective || "Submit photo proof",
        location: { name: locationName || "Specified location", lat: 0, lng: 0 },
        stakeAmount: stakeAmount * 1_000_000,
        durationMinutes: duration,
        creatorAddress: wallet.address || "rDemoUser",
        challengeMode,
        ...(challengeMode === "versus" && opponentAddress ? { opponentAddress } : {}),
      } : {
        title: preset!.title,
        description: preset!.description,
        objective: preset!.objective,
        location: preset!.location,
        stakeAmount: preset!.stakeAmount * 1_000_000,
        durationMinutes: preset!.durationMinutes,
        creatorAddress: wallet.address || "rDemoUser",
        challengeMode,
        ...(challengeMode === "versus" && opponentAddress ? { opponentAddress } : {}),
      };

      const challenge = createChallenge(data);

      setCreationStep("creating");

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
        signal: controller.signal,
      });

      const escrowData = await escrowResp.json();
      if (!escrowResp.ok || !escrowData.success) {
        throw new Error(escrowData.error || "Failed to create XRPL escrow");
      }

      setCreationStep("confirming");

      // Persist escrow details for settlement step
      updateChallenge(challenge.id, {
        escrowTxHash: escrowData.escrowTxHash,
        escrowSequence: escrowData.escrowSequence,
        escrowOwner: escrowData.escrowOwner,
      });

      // Brief pause so user sees the confirming step
      await new Promise(r => setTimeout(r, 800));

      setCreationStep("success");
      setEscrowResult({
        txHash: escrowData.escrowTxHash,
        sequence: escrowData.escrowSequence,
        challengeId: challenge.id,
      });

      // Auto-redirect after showing success
      setTimeout(() => {
        router.push(`/challenge/${challenge.id}`);
      }, 2500);
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "XRPL testnet is slow — try again."
        : error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
      setCreationStep("error");
      setCreationError(message);
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
    }
  };

  const handleRetry = () => {
    setCreationStep("idle");
    setCreationError(null);
    setEscrowResult(null);
  };

  const handleExpand = async () => {
    if (title.length < 3) return;
    setExpanding(true);
    try {
      const res = await fetch("/api/challenge/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.success) {
        setDescription(data.description);
        setObjective(data.objective);
        setStakeAmount(data.suggestedStakeXrp);
        setDuration(data.suggestedDurationMinutes);
        setAiSuggested(new Set(["description", "objective", "stake", "duration"]));
      }
    } catch (err) { console.warn("[Create] AI expand failed:", err); }
    setExpanding(false);
  };

  const clearAiTag = (field: string) => {
    setAiSuggested((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleCopyLink = (challengeId: string) => {
    const url = `${window.location.origin}/challenge/${challengeId}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const xrpAmount = isCustom ? stakeAmount : (preset?.stakeAmount ?? 10);

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
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

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Challenge mode toggle */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--vs-text-secondary)] uppercase tracking-wider mb-3">
            Challenge Type
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setChallengeMode("self")}
              className={`p-3 rounded-xl text-left transition-all border flex flex-col items-center gap-1.5 text-center ${
                challengeMode === "self"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-[var(--vs-border)] hover:border-zinc-300"
              }`}
            >
              <User className={`w-5 h-5 ${challengeMode === "self" ? "text-emerald-600" : "text-zinc-400"}`} />
              <p className="font-medium text-sm text-[var(--vs-text-primary)]">Solo</p>
              <p className="text-[10px] text-[var(--vs-text-tertiary)] leading-tight">Bet on yourself</p>
            </button>
            <button
              onClick={() => setChallengeMode("versus")}
              className={`p-3 rounded-xl text-left transition-all border flex flex-col items-center gap-1.5 text-center ${
                challengeMode === "versus"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-[var(--vs-border)] hover:border-zinc-300"
              }`}
            >
              <Users className={`w-5 h-5 ${challengeMode === "versus" ? "text-emerald-600" : "text-zinc-400"}`} />
              <p className="font-medium text-sm text-[var(--vs-text-primary)]">Versus</p>
              <p className="text-[10px] text-[var(--vs-text-tertiary)] leading-tight">Dare a friend</p>
            </button>
            <button
              onClick={() => setChallengeMode("bounty")}
              className={`p-3 rounded-xl text-left transition-all border flex flex-col items-center gap-1.5 text-center ${
                challengeMode === "bounty"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-[var(--vs-border)] hover:border-zinc-300"
              }`}
            >
              <Globe className={`w-5 h-5 ${challengeMode === "bounty" ? "text-amber-600" : "text-zinc-400"}`} />
              <p className="font-medium text-sm text-[var(--vs-text-primary)]">Bounty</p>
              <p className="text-[10px] text-[var(--vs-text-tertiary)] leading-tight">Open to the world</p>
            </button>
          </div>
          {challengeMode === "self" && (
            <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 rounded-lg px-3 py-2">
              Stake XRP on yourself. Complete the objective to earn it back.
            </p>
          )}
          {challengeMode === "bounty" && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg px-3 py-2">
              Anyone can attempt this challenge. First valid proof wins the bounty.
            </p>
          )}
        </section>

        {/* Presets */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--vs-text-secondary)] uppercase tracking-wider mb-3">
            Quick Start
          </h2>
          <div className="space-y-2">
            {PRESETS.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedPreset(p.id);
                  setIsCustom(false);
                }}
                className={`w-full p-5 rounded-2xl text-left transition-all border ${
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
              </motion.button>
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
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Run a mile"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border-[var(--vs-border)] flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 border-[var(--vs-border)] hover:border-emerald-300 hover:bg-emerald-50"
                  disabled={title.length < 3 || expanding}
                  onClick={handleExpand}
                  title="AI Expand"
                >
                  {expanding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <Wand2 className="w-4 h-4 text-emerald-600" />
                  )}
                </Button>
              </div>
            </div>

            {/* Privacy trust card */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--vs-text-primary)]">Privacy-Preserving AI</p>
                  <p className="text-xs text-[var(--vs-text-secondary)] mt-0.5">
                    Only your title text is sent. No wallet, no IP, no metadata reaches the AI.
                  </p>
                  <p className="text-xs text-[var(--vs-text-tertiary)] mt-1">
                    Future: Chainlink Functions for decentralized oracle verification
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-sm font-medium text-[var(--vs-text-secondary)]">Description</label>
                {aiSuggested.has("description") && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">AI suggested</span>
                )}
              </div>
              {expanding ? (
                <div className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
              ) : (
                <Input
                  placeholder="What is this challenge about?"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearAiTag("description"); }}
                  className="rounded-xl border-[var(--vs-border)]"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-sm font-medium text-[var(--vs-text-secondary)]">Proof Objective</label>
                {aiSuggested.has("objective") && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">AI suggested</span>
                )}
              </div>
              {expanding ? (
                <div className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
              ) : (
                <Input
                  placeholder="What should the photo show?"
                  value={objective}
                  onChange={(e) => { setObjective(e.target.value); clearAiTag("objective"); }}
                  className="rounded-xl border-[var(--vs-border)]"
                />
              )}
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
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-[var(--vs-text-secondary)]">Stake (XRP)</label>
                  {aiSuggested.has("stake") && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">AI</span>
                  )}
                </div>
                {expanding ? (
                  <div className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
                ) : (
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={stakeAmount}
                    onChange={(e) => { setStakeAmount(parseInt(e.target.value) || 10); clearAiTag("stake"); }}
                    className="rounded-xl border-[var(--vs-border)]"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-[var(--vs-text-secondary)]">Time Limit</label>
                  {aiSuggested.has("duration") && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">AI</span>
                  )}
                </div>
                {expanding ? (
                  <div className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
                ) : (
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={duration}
                    onChange={(e) => { setDuration(parseInt(e.target.value) || 20); clearAiTag("duration"); }}
                    className="rounded-xl border-[var(--vs-border)]"
                  />
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Versus: target wallet address */}
        {challengeMode === "versus" && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6"
          >
            <label className="text-sm font-medium text-[var(--vs-text-secondary)] block mb-1.5">
              Target wallet <span className="text-[var(--vs-text-tertiary)] font-normal">(optional)</span>
            </label>
            <Input
              placeholder="rFriendAddress..."
              value={opponentAddress}
              onChange={(e) => setOpponentAddress(e.target.value)}
              className="rounded-lg border-[var(--vs-border)] font-mono text-sm"
            />
            <p className="text-xs text-[var(--vs-text-tertiary)] mt-1.5">
              Only this wallet can accept. Leave blank for open challenge.
            </p>
          </motion.section>
        )}

        {/* Escrow info */}
        <section className="mb-6 p-4 rounded-xl bg-white border border-[var(--vs-border)]">
          <div className="flex items-start gap-3">
            {escrowImgError ? (
              <div className="w-14 h-14 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
            ) : (
              <img
                src="/illustrations/escrow-info.jpg"
                alt="XRPL Escrow vault"
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                loading="eager"
                draggable={false}
                onError={() => setEscrowImgError(true)}
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-[var(--vs-text-primary)]">XRPL Escrow</p>
                <TrustBadge variant="xrpl" size="sm" animated={false} />
              </div>
              <p className="text-sm text-[var(--vs-text-secondary)] leading-relaxed">
                No account needed — your challenge is secured by XRPL escrow, not passwords. Stake locks on-chain and settles automatically via AI verification.
              </p>
              <p className="text-xs text-[var(--vs-text-tertiary)] mt-1">
                Wallet addresses replace user accounts. Everything is verifiable on the ledger.
              </p>
            </div>
          </div>
        </section>

        {/* Service Status */}
        <section className="mb-6">
          <ServiceStatus />
        </section>

        {/* Create / Pipeline / Error / Success */}
        <section>
          {creationStep === "idle" && (
            <>
              {wallet.address && (
                <p className="text-center text-xs text-[var(--vs-text-tertiary)] mb-3">
                  Creating as <span className="font-mono text-[var(--vs-text-secondary)]">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                </p>
              )}
              <Button
                size="lg"
                className="w-full h-12 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm shadow-emerald-600/15"
                onClick={handleCreate}
                disabled={!preset && !isCustom}
              >
                Create {challengeMode === "bounty" ? "Bounty" : "Challenge"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-[var(--vs-text-tertiary)] mt-3">
                Stake will be locked until challenge resolves
              </p>
            </>
          )}

          {(creationStep === "connecting" || creationStep === "creating" || creationStep === "confirming") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <MoneyFlowVisualization
                flowState={creationStep === "confirming" ? "locked" : "funding"}
                amountXrp={xrpAmount}
                creatorAddress={wallet.address || "rDemoUser"}
                compact
              />
              <EscrowCreationPipeline currentStep={creationStep} />
            </motion.div>
          )}

          {creationStep === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <EscrowCreationPipeline currentStep="error" errorMessage={creationError || "Unknown error"} />
              </div>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 gap-2 rounded-lg border-red-200 text-red-700 hover:bg-red-50"
                onClick={handleRetry}
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            </motion.div>
          )}

          {creationStep === "success" && escrowResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <EscrowCreationPipeline currentStep="success" txHash={escrowResult.txHash} />
                <div className="mt-4 text-center">
                  <a
                    href={`https://testnet.xrpl.org/transactions/${escrowResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on XRPL Explorer
                  </a>
                </div>
              </div>
              {(challengeMode === "versus" || challengeMode === "bounty") && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleCopyLink(escrowResult.challengeId)}
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? "Copied!" : "Copy Challenge Link"}
                </Button>
              )}
              <Button
                size="lg"
                className="w-full h-12 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                onClick={() => router.push(`/challenge/${escrowResult.challengeId}`)}
              >
                View Challenge
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
