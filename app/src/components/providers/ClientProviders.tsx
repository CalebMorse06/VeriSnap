"use client";

import { WalletProvider } from "@/lib/wallet-context";
import type { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
