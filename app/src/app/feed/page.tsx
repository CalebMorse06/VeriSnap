"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, CheckCircle2, XCircle, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustBadge, TrustPillars } from "@/components/ui/trust-badge";
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
    <div className="min-h-screen bg-[var(--vs-bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--vs-border)] sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-[var(--vs-text-secondary)] hover:text-[var(--vs-text-primary)] hover:bg-zinc-100 -ml-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--vs-text-primary)]">Public Feed</h1>
              <p className="text-xs text-[var(--vs-text-tertiary)]">Completed challenges</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[var(--vs-border)] overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-[var(--vs-text-secondary)] mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && feed.length === 0 && (
          <div className="text-center py-16">
            <img
              src="/illustrations/feed-empty-state.jpg"
              alt="No public challenges yet"
              className="w-32 h-32 mx-auto mb-4 object-contain opacity-80"
              draggable={false}
            />
            <h2 className="text-base font-medium text-[var(--vs-text-primary)] mb-2">No public challenges yet</h2>
            <p className="text-[var(--vs-text-secondary)] text-sm mb-6">
              Completed challenges will appear here when creators choose to share them.
            </p>
            <Link href="/challenge/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Create a Challenge
              </Button>
            </Link>
          </div>
        )}

        {/* Feed */}
        {!loading && !error && feed.length > 0 && (
          <div className="space-y-4">
            {feed.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ delay: index * 0.03 }}
              >
                <FeedCard item={item} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[var(--vs-border-subtle)]">
          <TrustPillars />
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
    <div className="bg-white rounded-xl border border-[var(--vs-border)] overflow-hidden">
      {/* Proof image */}
      {proofUrl && (
        <div className="relative aspect-video bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Challenge proof"
            className="w-full h-full object-cover"
          />
          {/* Outcome badge - top right */}
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-sm font-medium ${
            item.passed 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {item.passed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passed</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Failed</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium text-[var(--vs-text-primary)]">{item.title}</h3>
          <span className="text-base font-semibold text-emerald-600 whitespace-nowrap">
            {item.stakeXrp} XRP
          </span>
        </div>

        <p className="text-sm text-[var(--vs-text-tertiary)] mb-3">{item.locationName}</p>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <TrustBadge variant="verified" size="sm" animated={false} />
          {item.confidence && (
            <span className="text-xs text-[var(--vs-text-tertiary)]">
              {item.confidence}% confidence
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--vs-border-subtle)]">
          <div className="flex items-center gap-1 text-xs text-[var(--vs-text-tertiary)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(item.resolvedAt).toLocaleDateString()}</span>
          </div>

          {item.settlementTx && (
            <a
              href={`https://testnet.xrpl.org/transactions/${item.settlementTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View on XRPL
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
