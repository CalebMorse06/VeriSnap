"use client";

import { useEffect, useState } from "react";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustPillars } from "@/components/ui/trust-badge";
import {
  Plus,
  RotateCcw,
  Globe,
  ArrowRight,
  Camera,
  Lock,
  Cpu,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Challenge, ChallengeStatus } from "@/types/challenge";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getChallenges } from "@/lib/store/challenges";
import { ServiceStatus } from "@/components/status/ServiceStatus";

function toUiChallenge(c: ReturnType<typeof getChallenges>[number]): Challenge {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    objective: c.objective,
    location: c.location,
    stakeAmount: c.stakeAmount,
    creatorAddress: c.creatorAddress,
    status: c.status as ChallengeStatus,
    createdAt: new Date(c.createdAt),
    expiresAt: new Date(c.expiresAt),
    xrpTxHash: c.escrowTxHash,
  };
}

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/challenges", { cache: "no-store" });
        const json = await res.json();
        if (mounted && res.ok && json.success && Array.isArray(json.challenges)) {
          const mapped = json.challenges.map((c: Record<string, unknown>) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops,
            creatorAddress: c.escrow_owner || c.creator_id,
            status: c.status as ChallengeStatus,
            createdAt: new Date(c.created_at as string),
            expiresAt: new Date(c.expires_at as string),
            xrpTxHash: c.escrow_tx_hash,
          } as Challenge));
          setChallenges(mapped);
        } else {
          setChallenges(getChallenges().map(toUiChallenge));
        }
      } catch {
        setChallenges(getChallenges().map(toUiChallenge));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const resetDemo = () => {
    sessionStorage.removeItem("verisnap_challenges");
    sessionStorage.removeItem("proofData");
    sessionStorage.removeItem("verificationResult");
    sessionStorage.removeItem("challengeAccepted");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/illustrations/veri-trust-logo.jpg" alt="VeriSnap" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-bold text-zinc-900 tracking-tight">VeriSnap</span>
          </div>
          <div className="flex items-center gap-2">
            <ServiceStatus compact />
            <Link href="/feed">
              <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50">
                <Globe className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
              onClick={resetDemo}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Link href="/challenge/create">
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium px-4">
                <Plus className="w-4 h-4" />
                New
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-32 sm:pb-36">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-5xl sm:text-6xl font-bold text-zinc-900 leading-[1.05] tracking-[-0.03em]"
              >
                Prove it,<br />
                earn it.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-6 text-lg sm:text-xl text-zinc-500 leading-relaxed max-w-md"
              >
                Stake XRP on real-world challenges. Submit photo proof. AI verifies. Settle on-chain — no accounts, no trust required.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 flex items-center gap-3"
              >
                <Link href="/challenge/create">
                  <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium px-8 h-13 text-base shadow-lg shadow-emerald-600/20">
                    Create a Challenge
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button size="lg" variant="ghost" className="text-zinc-600 hover:text-zinc-900 rounded-full h-12 text-base border border-zinc-200">
                    Browse Feed
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex items-center gap-4 text-xs text-zinc-400"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  XRPL Testnet
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Transactions
                </span>
              </motion.div>
            </div>

            {/* Right — hero illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden sm:flex items-center justify-center"
            >
              <img
                src="/illustrations/hero-phone.jpg"
                alt="VeriSnap — verified proof on blockchain"
                className="w-full max-w-[380px] rounded-3xl"
                draggable={false}
              />
              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="absolute -right-4 top-16 bg-white rounded-xl shadow-lg border border-zinc-200 p-3 w-48"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-900">Challenge Passed</span>
                </div>
                <p className="text-[10px] text-zinc-500">+20 XRP settled on-chain</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-emerald-50 blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-zinc-50 blur-3xl" />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-[-0.02em]">How it works</h2>
            <p className="mt-3 text-zinc-500 max-w-lg mx-auto">Four steps. No sign-up. No passwords. Just your wallet and a camera.</p>
          </div>

          <div className="grid sm:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: Lock,
                title: "Stake",
                desc: "XRP locks in an on-chain escrow. Neither side can back out.",
                color: "bg-emerald-100 text-emerald-700",
              },
              {
                step: "02",
                icon: Camera,
                title: "Snap",
                desc: "Capture live photo proof of your completed challenge.",
                color: "bg-blue-100 text-blue-700",
              },
              {
                step: "03",
                icon: Cpu,
                title: "Verify",
                desc: "AI analyzes your proof for authenticity and objective match.",
                color: "bg-violet-100 text-violet-700",
              },
              {
                step: "04",
                icon: Zap,
                title: "Settle",
                desc: "Pass? XRP releases instantly. Fail? Stake returns to creator.",
                color: "bg-amber-100 text-amber-700",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="text-[11px] font-bold text-zinc-400 tracking-widest uppercase mb-2">{item.step}</p>
                <h3 className="text-lg font-semibold text-zinc-900 mb-1">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack — visible and proud */}
      <section className="border-t border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-[-0.02em]">Built on real infrastructure</h2>
            <p className="mt-3 text-zinc-500 max-w-lg mx-auto">Every challenge is backed by verifiable, on-chain technology — not promises.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                name: "XRPL Escrow",
                desc: "Stake locks in a native XRPL escrow transaction. Trustless, atomic, on-ledger.",
                tag: "Enforcement",
                tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                icon: Lock,
                name: "Pinata IPFS",
                desc: "Proof photos stored on private IPFS. Tamper-proof, content-addressed, permanent.",
                tag: "Evidence",
                tagColor: "bg-zinc-50 text-zinc-600 border-zinc-200",
              },
              {
                icon: Cpu,
                name: "Gemini AI",
                desc: "Google's Gemini 2.0 Flash analyzes proof photos for authenticity and objective match.",
                tag: "Verification",
                tagColor: "bg-violet-50 text-violet-700 border-violet-200",
              },
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-zinc-200 p-7 hover:border-zinc-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <tech.icon className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{tech.name}</h3>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${tech.tagColor}`}>
                      {tech.tag}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo placeholder section */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-[-0.02em] leading-tight">
                Your challenge,<br />your proof.
              </h2>
              <p className="mt-4 text-zinc-500 leading-relaxed">
                VeriSnap turns everyday goals into verifiable achievements. Hit the gym, visit a landmark, grab coffee with a friend — stake real value and prove you showed up.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "No accounts — wallet addresses only",
                  "No middleman — escrow settles automatically",
                  "No faking — AI catches screenshots and printouts",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </div>
                    <span className="text-sm text-zinc-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/challenge/create">
                <Button className="mt-8 gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium px-5 h-11">
                  Try it now
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Photo grid with illustrations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#f4f4f5] border border-zinc-200/50">
                <img
                  src="/illustrations/camera-viewfinder.jpg"
                  alt="Camera viewfinder — capture your proof"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#f4f4f5] border border-zinc-200/50 mt-6">
                <img
                  src="/illustrations/photo-grid-slot-b.jpg"
                  alt="Verified photo proof"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Challenges */}
      <section className="border-t border-zinc-100">
        <div className="max-w-xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900">Active Challenges</h2>
            <span className="text-xs text-zinc-400">
              {!loading && `${challenges.length} total`}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : challenges.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <img
                  src="/illustrations/home-empty-state.jpg"
                  alt="No challenges yet"
                  className="w-28 h-28 mx-auto mb-4 object-contain opacity-80"
                  draggable={false}
                />
                <h3 className="text-base font-medium text-zinc-900">No active challenges</h3>
                <p className="text-zinc-500 text-sm mt-1">Create your first challenge to get started.</p>
                <Link href="/challenge/create">
                  <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                    Create Challenge
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {challenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ChallengeCard
                      challenge={challenge}
                      onAccept={() => { window.location.href = `/challenge/${challenge.id}/accept`; }}
                      onView={() => { window.location.href = `/challenge/${challenge.id}`; }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-100 bg-zinc-900">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">Ready to put skin in the game?</h2>
          <p className="mt-3 text-zinc-400 max-w-md mx-auto">Create a challenge, stake real XRP, and prove you can follow through.</p>
          <Link href="/challenge/create">
            <Button size="lg" className="mt-8 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium px-8 h-12 text-base">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/illustrations/veri-trust-logo.jpg" alt="VeriSnap" className="w-6 h-6 rounded-md object-cover" />
              <span className="text-sm font-semibold text-zinc-900">VeriSnap</span>
            </div>
            <TrustPillars />
            <p className="text-xs text-zinc-400">
              Built for XRPL Demo Day
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
