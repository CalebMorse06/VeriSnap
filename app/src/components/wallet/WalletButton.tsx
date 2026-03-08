"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { Wallet, LogOut, Loader2, ChevronDown } from "lucide-react";

export function WalletButton() {
  const { address, isConnected, connect, generateTestnet, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [pasteAddr, setPasteAddr] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await generateTestnet();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleConnect = () => {
    if (pasteAddr.trim().startsWith("r") && pasteAddr.trim().length >= 25) {
      connect(pasteAddr.trim());
      setPasteAddr("");
      setOpen(false);
      setError(null);
    } else {
      setError("Invalid address — must start with 'r'");
    }
  };

  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          isConnected
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200"
        }`}
      >
        {isConnected ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono">{truncated}</span>
          </>
        ) : (
          <>
            <Wallet className="w-3 h-3" />
            <span>Connect</span>
          </>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-[100] p-3 space-y-3">
          {isConnected ? (
            <>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Connected Wallet</p>
                <p className="text-sm font-mono text-white break-all">{address}</p>
              </div>
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-zinc-400 mb-1.5">Paste address</p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="rAddress..."
                    value={pasteAddr}
                    onChange={(e) => setPasteAddr(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleConnect}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                  >
                    Go
                  </button>
                </div>
              </div>
              <div className="border-t border-zinc-700 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wallet className="w-3 h-3" />
                  )}
                  {generating ? "Generating..." : "Generate Testnet Wallet"}
                </button>
              </div>
            </>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
