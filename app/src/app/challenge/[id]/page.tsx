"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, ChevronLeft, User, Zap, Shield, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { TxLink } from "@/components/ui/tx-link";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getChallenge, ChallengeData } from "@/lib/store/challenges";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Always try API first for freshest data
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success && json.challenge) {
          const c = json.challenge;
          setChallenge({
            id: c.id,
            title: c.title,
            description: c.description,
            objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops,
            durationMinutes: c.duration_minutes,
            creatorAddress: c.escrow_owner || c.creator_id,
            status: c.status,
            createdAt: new Date(c.created_at).getTime(),
            expiresAt: new Date(c.expires_at).getTime(),
            escrowTxHash: c.escrow_tx_hash,
            escrowSequence: c.escrow_sequence,
            escrowOwner: c.escrow_owner,
          });
          if (mounted) setLoading(false);
          return;
        }
      } catch {}

      // Fallback to local store
      if (mounted) {
        const stored = getChallenge(challengeId);
        if (stored) setChallenge(stored);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [challengeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="h-56 bg-zinc-200 animate-pulse" />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-700">Challenge not found</h2>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const xrpAmount = (challenge.stakeAmount / 1_000_000).toFixed(0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="relative h-64 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <Link href="/" className="absolute top-4 left-4 z-10">
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <TrustBadge variant="escrow" size="sm" animated={false} />
              <h1 className="text-2xl font-bold text-white mt-2">{challenge.title}</h1>
              <p className="text-zinc-300 text-sm mt-1 line-clamp-2">{challenge.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-zinc-400 text-xs mb-1">STAKE</p>
              <p className="text-3xl font-bold text-emerald-400">{xrpAmount}</p>
              <p className="text-emerald-300 text-sm">XRP</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Quick stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-lg font-bold text-zinc-900">{challenge.durationMinutes}</p>
                  <p className="text-xs text-zinc-500">Minutes</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <Lock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-lg font-bold text-zinc-900">{xrpAmount}</p>
                  <p className="text-xs text-zinc-500">XRP Escrow</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-lg font-bold text-zinc-900">1</p>
                  <p className="text-xs text-zinc-500">Location</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Objective */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <h2 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verification Objective
              </h2>
              <p className="text-blue-800 text-sm leading-relaxed">{challenge.objective}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                Location
              </h2>
              <div className="h-24 bg-zinc-100 rounded-lg mb-3 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">{challenge.location.name}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Escrow transaction */}
        {challenge.escrowTxHash && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <TxLink hash={challenge.escrowTxHash} type="escrow" />
          </motion.div>
        )}

        {/* Trust pillars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-zinc-900 mb-3">Powered By</h2>
              <TrustPillars size="sm" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Creator */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">Created by</p>
                <p className="text-sm font-mono text-zinc-700 truncate">{challenge.creatorAddress}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accept button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Button
            size="lg"
            className="w-full text-lg h-14 gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20"
            onClick={() => router.push(`/challenge/${challengeId}/accept`)}
          >
            <Zap className="w-5 h-5" />
            Accept Challenge
          </Button>
          <p className="text-center text-xs text-zinc-500 mt-3">
            {xrpAmount} XRP will be locked in XRPL escrow
          </p>
        </motion.div>
      </main>
    </div>
  );
}
