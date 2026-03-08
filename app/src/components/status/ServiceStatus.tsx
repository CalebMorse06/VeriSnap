"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface ServiceDetail {
  ok: boolean;
  latencyMs: number | null;
  error?: string;
}

interface HealthStatus {
  ok: boolean;
  services: {
    xrpl: ServiceDetail;
    pinata: ServiceDetail;
    gemini: ServiceDetail;
    supabase: ServiceDetail;
  };
}

export function ServiceStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok) {
        setStatus(await res.json());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
        ) : error ? (
          <WifiOff className="w-3.5 h-3.5 text-red-500" />
        ) : status?.ok ? (
          <Wifi className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-yellow-500" />
        )}
        <span className="text-xs text-zinc-500">
          {loading ? "Checking..." : error ? "Offline" : status?.ok ? "Connected" : "Partial"}
        </span>
      </div>
    );
  }

  const services = status?.services;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 rounded-xl bg-zinc-50 border border-zinc-200"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-zinc-700">Service Status</h4>
        <button onClick={checkHealth} className="text-zinc-400 hover:text-zinc-600">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">Unable to reach services</p>
      ) : services ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatusItem label="XRPL" detail={services.xrpl} />
          <StatusItem label="Pinata" detail={services.pinata} />
          <StatusItem label="Gemini" detail={services.gemini} />
          <StatusItem label="Database" detail={services.supabase} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Checking services...</p>
      )}
    </motion.div>
  );
}

function StatusItem({ label, detail }: { label: string; detail: ServiceDetail }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${detail.ok ? "bg-green-500" : "bg-red-500"}`} />
      <span className={detail.ok ? "text-zinc-700" : "text-red-600"}>
        {label}
        {detail.ok && detail.latencyMs !== null && (
          <span className="text-zinc-400 ml-1">{detail.latencyMs}ms</span>
        )}
      </span>
    </div>
  );
}
