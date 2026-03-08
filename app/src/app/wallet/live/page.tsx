"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowDownLeft, ArrowUpRight, ExternalLink, Link2, Loader2, RefreshCw, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Transaction {
  hash: string;
  type: string;
  from: string;
  to: string;
  amount: string | null;
  memo: string | null;
  date: number;
  success: boolean;
}

const POLL_INTERVAL = 4000;
const XRPL_EPOCH_OFFSET = 946684800;

export default function LiveWalletPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    }>
      <LiveWalletInner />
    </Suspense>
  );
}

function LiveWalletInner() {
  const searchParams = useSearchParams();
  const addressParam = searchParams.get("address");

  const [address, setAddress] = useState<string | null>(addressParam);
  const [appWallet, setAppWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [prevBalance, setPrevBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTxHashes, setNewTxHashes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [balanceFlash, setBalanceFlash] = useState<"up" | "down" | null>(null);
  const seenHashes = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const balanceRef = useRef<string | null>(null);

  // On mount: if no address param, auto-fetch the app wallet address
  useEffect(() => {
    if (addressParam) {
      setAddress(addressParam);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        if (data.appWallet) {
          setAppWallet(data.appWallet);
          // Auto-watch app wallet
          setAddress(data.appWallet);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [addressParam]);

  const fetchData = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/wallet/live?address=${address}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) return;

      // Detect balance change
      const currentBal = balanceRef.current;
      if (currentBal !== null && data.balance !== currentBal) {
        setPrevBalance(currentBal);
        const diff = parseFloat(data.balance) - parseFloat(currentBal);
        setBalanceFlash(diff > 0 ? "up" : "down");
        setTimeout(() => setBalanceFlash(null), 2500);
      }
      setBalance(data.balance);
      balanceRef.current = data.balance;

      // Detect new transactions
      const incoming = data.transactions as Transaction[];
      if (!isFirstLoad.current) {
        const fresh = new Set<string>();
        for (const tx of incoming) {
          if (tx.hash && !seenHashes.current.has(tx.hash)) {
            fresh.add(tx.hash);
          }
        }
        if (fresh.size > 0) {
          setNewTxHashes(fresh);
          setTimeout(() => setNewTxHashes(new Set()), 3000);
        }
      }

      for (const tx of incoming) {
        if (tx.hash) seenHashes.current.add(tx.hash);
      }
      isFirstLoad.current = false;
      setTransactions(incoming);
    } catch (err) {
      console.warn("[LiveWallet] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Poll
  useEffect(() => {
    if (!address) return;
    isFirstLoad.current = true;
    seenHashes.current = new Set();
    balanceRef.current = null;
    setBalance(null);
    setTransactions([]);
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [address, fetchData]);

  const truncate = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  // No address yet — show setup screen
  if (!address) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Live Wallet</h1>
            <p className="text-zinc-400 mt-2">Watch funds arrive in real-time on a second screen</p>
          </div>

          {appWallet && (
            <button
              onClick={() => setAddress(appWallet)}
              className="w-full p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
            >
              Watch App Wallet
              <p className="text-xs text-emerald-200 font-mono mt-1">{truncate(appWallet)}</p>
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-zinc-950 px-2 text-zinc-600">or paste any address</span></div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem("addr") as HTMLInputElement).value.trim();
            if (input.startsWith("r") && input.length >= 25) setAddress(input);
          }}>
            <div className="flex gap-2">
              <input
                name="addr"
                type="text"
                placeholder="rAddress..."
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button type="submit" className="px-4 py-3 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700">
                Watch
              </button>
            </div>
          </form>

          {appWallet && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-zinc-950 px-2 text-zinc-600">or scan on your phone</span></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG
                    value={typeof window !== "undefined"
                      ? `${window.location.origin}/wallet/live?address=${appWallet}`
                      : `/wallet/live?address=${appWallet}`}
                    size={140}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">Opens live wallet watcher on your phone</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/illustrations/veri-trust-logo.jpg" alt="VeriSnap" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-sm font-semibold text-zinc-400">VeriSnap</span>
            <span className="text-zinc-700">|</span>
            <span className="text-sm font-medium text-emerald-400">Live Wallet</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-500">XRPL Testnet</span>
            </div>
            <button
              onClick={() => { setAddress(null); setBalance(null); setTransactions([]); }}
              className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Switch
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Address */}
        <div className="text-center mb-2">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Watching</p>
          <p className="text-sm font-mono text-zinc-400">{address}</p>
        </div>

        {/* Balance */}
        <div className="text-center my-10 relative">
          {loading ? (
            <Loader2 className="w-10 h-10 text-zinc-600 animate-spin mx-auto" />
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={balance}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative inline-block"
                >
                  <p className={`text-7xl sm:text-8xl font-bold tabular-nums tracking-tight transition-colors duration-500 ${
                    balanceFlash === "up" ? "text-emerald-400" :
                    balanceFlash === "down" ? "text-red-400" :
                    "text-white"
                  }`}>
                    {parseFloat(balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xl text-zinc-500 mt-1 font-medium">XRP</p>

                  {/* Flash indicator */}
                  {balanceFlash && prevBalance && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`absolute -right-6 sm:-right-8 top-2 px-3 py-1.5 rounded-full text-base sm:text-lg font-bold whitespace-nowrap ${
                        balanceFlash === "up"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {balanceFlash === "up" ? "+" : ""}{(parseFloat(balance || "0") - parseFloat(prevBalance)).toFixed(2)} XRP
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Glow effect on balance increase */}
              {balanceFlash === "up" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.3, 1.6] }}
                  transition={{ duration: 2 }}
                  className="absolute inset-0 -z-10 mx-auto w-96 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"
                />
              )}
            </>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recent Transactions</h2>
          <button
            onClick={fetchData}
            className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-600">No transactions yet</p>
            <p className="text-xs text-zinc-700 mt-1">Transactions will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {transactions.map((tx) => {
                const isIncoming = tx.to === address;
                const isNew = newTxHashes.has(tx.hash);
                const date = tx.date ? new Date((tx.date + XRPL_EPOCH_OFFSET) * 1000) : null;

                return (
                  <motion.div
                    key={tx.hash}
                    initial={isNew ? { opacity: 0, x: -30, scale: 0.95 } : false}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={isNew ? { type: "spring", stiffness: 400, damping: 25 } : {}}
                    className={`p-4 rounded-xl border transition-all ${
                      isNew
                        ? isIncoming
                          ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20"
                          : "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20"
                        : "bg-zinc-900/50 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isIncoming ? "bg-emerald-500/20" : "bg-zinc-800"
                      }`}>
                        {isIncoming
                          ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                          : <ArrowUpRight className="w-4 h-4 text-zinc-400" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {tx.type === "EscrowCreate" ? "Escrow Created" :
                             tx.type === "EscrowFinish" ? "Escrow Settled" :
                             tx.type === "EscrowCancel" ? "Escrow Cancelled" :
                             tx.type === "Payment" ? (isIncoming ? "Received" : "Sent") :
                             tx.type}
                          </p>
                          {isNew && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white"
                            >
                              New
                            </motion.span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-zinc-500 font-mono truncate">
                            {isIncoming ? `From ${truncate(tx.from)}` : `To ${truncate(tx.to)}`}
                          </p>
                          {tx.memo && (
                            <span className="text-[10px] text-zinc-600 truncate max-w-[140px]">
                              {tx.memo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {tx.amount && (
                          <p className={`text-sm font-semibold tabular-nums ${
                            isIncoming ? "text-emerald-400" : "text-zinc-400"
                          }`}>
                            {isIncoming ? "+" : "-"}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP
                          </p>
                        )}
                        {date && (
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            {date.toLocaleTimeString()}
                          </p>
                        )}
                      </div>

                      {tx.hash && (
                        <a
                          href={`https://testnet.xrpl.org/transactions/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-700 hover:text-zinc-400 flex-shrink-0 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-3 h-3" />
            <span>Polling XRPL Testnet every {POLL_INTERVAL / 1000}s</span>
          </div>
          <a
            href={`https://testnet.xrpl.org/accounts/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-500"
          >
            View on XRPL Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </main>
    </div>
  );
}
