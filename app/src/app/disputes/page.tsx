"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ThumbsUp, ThumbsDown, Clock, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustPillars } from "@/components/ui/trust-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/wallet-context";
import Link from "next/link";

interface Dispute {
  id: string;
  challenge_id: string;
  reason: string;
  proof_cid: string;
  ai_reverify_passed: boolean | null;
  ai_reverify_confidence: number | null;
  ai_reverify_reasoning: string | null;
  ai_reverify_scene_description: string | null;
  votes_pass: number;
  votes_fail: number;
  vote_deadline: string;
  status: string;
  created_at: string;
  resolution_outcome?: string;
  resolution_reasoning?: string;
  resolved_at?: string;
  settlement_tx?: string;
  challenges?: {
    id: string;
    title: string;
    objective: string;
    location_name: string;
    stake_amount_drops: number;
  };
}

export default function DisputesPage() {
  const wallet = useWallet();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    try {
      const res = await fetch("/api/disputes", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        const all = json.disputes as Dispute[];
        setDisputes(all);
        // Auto-resolve any past-deadline disputes
        for (const d of all) {
          if (d.status === "open" && new Date(d.vote_deadline) <= new Date()) {
            fetch(`/api/disputes/${d.id}/resolve`, { method: "POST" })
              .then(r => r.json())
              .then(data => {
                if (data.success) {
                  setDisputes(prev => prev.map(p =>
                    p.id === d.id ? { ...p, status: data.outcome, resolution_outcome: data.outcome, resolution_reasoning: data.reasoning, settlement_tx: data.settlementTx } : p
                  ));
                }
              })
              .catch(err => console.warn("[Disputes] Auto-resolve failed:", err));
          }
        }
      } else {
        setError(json.error || "Failed to load disputes");
      }
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(disputeId: string, vote: "pass" | "fail") {
    setVotingId(disputeId);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterAddress: wallet.address || "rDemoVoter" + Math.random().toString(36).substring(2, 6),
          vote,
        }),
      });
      const data = await res.json();
      if (data.success && data.dispute) {
        setDisputes((prev) =>
          prev.map((d) => (d.id === disputeId ? { ...d, ...data.dispute } : d))
        );
      }
    } catch (err) { console.warn("[Disputes] Vote failed:", err); }
    setVotingId(null);
  }

  function timeRemaining(deadline: string): string {
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms <= 0) return "Voting ended";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  }

  return (
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">Community Disputes</h1>
            <p className="text-xs text-[var(--vs-text-tertiary)]">Vote on disputed challenges</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {loading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[var(--vs-border)] p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-[var(--vs-text-secondary)] mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && disputes.length === 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h2 className="text-base font-medium text-[var(--vs-text-primary)] mb-2">No open disputes</h2>
            <p className="text-[var(--vs-text-secondary)] text-sm mb-6">
              When challenges are disputed, they will appear here for community voting.
            </p>
            <Link href="/feed">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                View Feed
              </Button>
            </Link>
          </div>
        )}

        {!loading && !error && disputes.length > 0 && (
          <div className="space-y-4">
            {disputes.map((d, index) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-[var(--vs-border)] overflow-hidden"
              >
                {/* Proof image */}
                {d.proof_cid && (
                  <div className="aspect-video bg-zinc-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://gateway.pinata.cloud/ipfs/${d.proof_cid}`}
                      alt="Disputed proof"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium">
                      Disputed
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Resolution banner */}
                  {d.status !== "open" && (
                    <div className={`p-3 rounded-lg ${
                      d.status === "resolved_pass"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                      <p className={`text-sm font-medium ${
                        d.status === "resolved_pass" ? "text-green-700" : "text-red-700"
                      }`}>
                        Resolved: {d.status === "resolved_pass" ? "PASSED" : "FAILED"}
                      </p>
                      {d.resolution_reasoning && (
                        <p className="text-xs text-zinc-600 mt-1">{d.resolution_reasoning}</p>
                      )}
                      {d.settlement_tx && (
                        <a
                          href={`https://testnet.xrpl.org/transactions/${d.settlement_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-1 inline-block"
                        >
                          Settlement TX: {d.settlement_tx.slice(0, 12)}...
                        </a>
                      )}
                    </div>
                  )}

                  {/* Challenge info */}
                  <div>
                    <h3 className="font-medium text-[var(--vs-text-primary)]">
                      {d.challenges?.title || "Challenge"}
                    </h3>
                    <p className="text-sm text-[var(--vs-text-secondary)] mt-0.5">
                      {d.challenges?.objective}
                    </p>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-[var(--vs-text-tertiary)] italic">
                    &ldquo;{d.reason}&rdquo;
                  </p>

                  {/* AI re-verify result */}
                  {d.ai_reverify_passed !== null && (
                    <div className={`p-3 rounded-lg ${d.ai_reverify_passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                      <p className="text-xs font-medium text-zinc-600 mb-1">AI Re-verification</p>
                      <p className={`text-sm font-medium ${d.ai_reverify_passed ? "text-green-700" : "text-red-700"}`}>
                        {d.ai_reverify_passed ? "Passed" : "Failed"} ({d.ai_reverify_confidence}%)
                      </p>
                      {d.ai_reverify_scene_description && (
                        <div className="flex items-start gap-1.5 mt-1.5">
                          <Eye className="w-3.5 h-3.5 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-zinc-600 italic">{d.ai_reverify_scene_description}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vote tally */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-green-600 font-medium">
                        <ThumbsUp className="w-4 h-4" /> {d.votes_pass} Pass
                      </span>
                      <span className="flex items-center gap-1.5 text-red-600 font-medium">
                        <ThumbsDown className="w-4 h-4" /> {d.votes_fail} Fail
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--vs-text-tertiary)]">
                      <Clock className="w-3.5 h-3.5" />
                      {d.status === "open" ? timeRemaining(d.vote_deadline) : "Voting closed"}
                    </div>
                  </div>

                  {/* Vote buttons — only for open disputes */}
                  {d.status === "open" && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 h-10 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        disabled={votingId === d.id}
                        onClick={() => handleVote(d.id, "pass")}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Pass
                      </Button>
                      <Button
                        className="flex-1 h-10 gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                        disabled={votingId === d.id}
                        onClick={() => handleVote(d.id, "fail")}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Fail
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
        </div>
      </main>
    </div>
  );
}
