"use client";

import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TxLinkProps {
  hash: string;
  type?: "escrow" | "settlement" | "generic";
  network?: "testnet" | "mainnet";
  truncate?: boolean;
}

export function TxLink({ hash, type = "generic", network = "testnet", truncate = true }: TxLinkProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = network === "testnet" ? "https://testnet.xrpl.org" : "https://livenet.xrpl.org";
  const url = `${baseUrl}/transactions/${hash}`;
  const displayHash = truncate ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = type === "escrow" ? "Escrow Tx" : type === "settlement" ? "Settlement Tx" : "Transaction";

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 font-medium">{typeLabel}</p>
        <p className="text-sm font-mono text-zinc-700 truncate">{displayHash}</p>
      </div>
      <button
        onClick={handleCopy}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-200 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-100 hover:bg-emerald-200 transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-emerald-600" />
      </a>
    </div>
  );
}
