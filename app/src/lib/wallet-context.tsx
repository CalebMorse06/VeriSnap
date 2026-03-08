"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface WalletState {
  address: string | null;
  seed: string | null;
  isConnected: boolean;
  connect: (address: string) => void;
  generateTestnet: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  seed: null,
  isConnected: false,
  connect: () => {},
  generateTestnet: async () => {},
  disconnect: () => {},
});

const STORAGE_KEY = "verisnap_wallet";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [seed, setSeed] = useState<string | null>(null);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.seed) setSeed(parsed.seed);
      }
    } catch (err) {
      console.warn("[Wallet] Failed to hydrate:", err);
    }
  }, []);

  const persist = useCallback((addr: string | null, s: string | null) => {
    if (addr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: addr, seed: s }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const connect = useCallback((addr: string) => {
    setAddress(addr);
    setSeed(null);
    persist(addr, null);
  }, [persist]);

  const generateTestnet = useCallback(async () => {
    const res = await fetch("/api/wallet/generate", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setAddress(data.address);
      setSeed(data.seed);
      persist(data.address, data.seed);
    } else {
      throw new Error(data.error || "Failed to generate wallet");
    }
  }, [persist]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSeed(null);
    persist(null, null);
  }, [persist]);

  return (
    <WalletContext.Provider
      value={{
        address,
        seed,
        isConnected: !!address,
        connect,
        generateTestnet,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
