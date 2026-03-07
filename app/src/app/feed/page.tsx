"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Trophy, XCircle, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface FeedItem {
  id: string;
  title: string;
  description: string;
  objective: string;
  locationName: string;
  stakeXrp: number;
  status: string;
  passed: boolean;
  confidence: number;
  proofCid: string;
  settlementTx: string;
  resolvedAt: string;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed?limit=20", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setFeed(json.feed);
        } else {
          setError(json.error || "Failed to load feed");
        }
      } catch {
        setError("Failed to connect");
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Public Feed</h1>
              <p className="text-white/80 text-sm">Completed challenges</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && feed.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-zinc-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">No public challenges yet</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Completed challenges will appear here when creators choose to share them.
            </p>
            <Link href="/challenge/create">
              <Button>Create a Challenge</Button>
            </Link>
          </div>
        )}

        {/* Feed */}
        {!loading && !error && feed.length > 0 && (
          <div className="space-y-4">
            {feed.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FeedCard item={item} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8">
          <TrustPillars size="sm" />
        </div>
      </main>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const proofUrl = item.proofCid 
    ? `https://gateway.pinata.cloud/ipfs/${item.proofCid}`
    : null;

  return (
    <Card className="overflow-hidden">
      {/* Proof thumbnail */}
      {proofUrl && (
        <div className="relative aspect-video bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Challenge proof"
            className="w-full h-full object-cover"
          />
          {/* Outcome badge */}
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
            item.passed 
              ? "bg-green-500 text-white" 
              : "bg-red-500 text-white"
          }`}>
            {item.passed ? (
              <>
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-semibold">Passed</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Failed</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-zinc-900">{item.title}</h3>
          <span className="text-lg font-bold text-emerald-600 whitespace-nowrap">
            {item.stakeXrp} XRP
          </span>
        </div>

        <p className="text-sm text-zinc-500 mb-3">{item.locationName}</p>

        {/* Trust badges */}
        <div className="flex items-center gap-2 mb-3">
          <TrustBadge variant="verified" size="sm" />
          <TrustBadge variant="xrpl" size="sm" />
          {item.confidence && (
            <span className="text-xs text-zinc-500">
              {item.confidence}% confidence
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(item.resolvedAt).toLocaleDateString()}</span>
          </div>

          {item.settlementTx && (
            <a
              href={`https://testnet.xrpl.org/transactions/${item.settlementTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              View on XRPL
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
