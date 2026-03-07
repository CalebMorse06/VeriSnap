"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Coins, Clock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Describe the challenge clearly"),
  objective: z.string().min(20, "Be specific — what must the photo show?"),
  location: z.string().min(3, "Add a location name"),
  stakeAmount: z.number().min(1, "Minimum 1 XRP").max(1000, "Max 1000 XRP"),
  durationHours: z.number().min(1).max(168),
});

type FormData = z.infer<typeof schema>;

const PRESETS = [
  {
    title: "Visit the KU Campanile",
    description: "Prove you're at the iconic KU Campanile tower on campus",
    objective: "Take a clear photo showing the KU Campanile bell tower with you visible in frame",
    location: "KU Campanile, Lawrence, KS",
    stakeAmount: 20,
    durationHours: 1,
  },
];

export default function CreateChallengePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stakeAmount: 20,
      durationHours: 1,
    },
  });

  const stakeAmount = watch("stakeAmount");

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setValue("title", preset.title);
    setValue("description", preset.description);
    setValue("objective", preset.objective);
    setValue("location", preset.location);
    setValue("stakeAmount", preset.stakeAmount);
    setValue("durationHours", preset.durationHours);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // In production: call API to create challenge + XRPL EscrowCreate
      // For demo: store in sessionStorage and navigate
      const challenge = {
        id: `challenge-${Date.now()}`,
        ...data,
        status: "FUNDED",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + data.durationHours * 3600 * 1000).toISOString(),
        // Mock XRPL data
        xrpTxHash: `ESCROW_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        escrowSequence: Math.floor(Math.random() * 1000000),
      };
      sessionStorage.setItem("activeChallenge", JSON.stringify(challenge));
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">Create Challenge</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Quick preset */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-medium text-zinc-500 mb-3">Quick Start</p>
          {PRESETS.map((preset) => (
            <button
              key={preset.title}
              onClick={() => loadPreset(preset)}
              className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-700">Demo: KU Campanile</span>
              </div>
              <p className="text-xs text-zinc-500">{preset.description}</p>
            </button>
          ))}
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-zinc-900">Challenge Details</h3>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Title</label>
                  <Input {...register("title")} placeholder="Visit the KU Campanile" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Description</label>
                  <Input {...register("description")} placeholder="Describe the challenge..." />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    Proof Objective
                    <span className="text-zinc-400 ml-1 font-normal">(what must the photo show?)</span>
                  </label>
                  <Input {...register("objective")} placeholder="Take a photo clearly showing the Campanile tower..." />
                  {errors.objective && <p className="text-red-500 text-xs mt-1">{errors.objective.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <Input {...register("location")} placeholder="KU Campanile, Lawrence, KS" />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-zinc-900">Stake & Duration</h3>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    <Coins className="w-4 h-4 inline mr-1" />
                    Stake Amount (XRP)
                  </label>
                  <Input
                    {...register("stakeAmount", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    placeholder="20"
                  />
                  {errors.stakeAmount && <p className="text-red-500 text-xs mt-1">{errors.stakeAmount.message}</p>}
                </div>

                {/* Quick stake presets */}
                <div className="flex gap-2">
                  {[5, 20, 50, 100].map(xrp => (
                    <button
                      key={xrp}
                      type="button"
                      onClick={() => setValue("stakeAmount", xrp)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        stakeAmount === xrp
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {xrp} XRP
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time Window (hours)
                  </label>
                  <Input
                    {...register("durationHours", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={168}
                    placeholder="1"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* XRPL callout */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-zinc-900">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-medium">XRPL Escrow</span> will lock{" "}
                  <span className="text-green-400 font-semibold">{stakeAmount || 0} XRP</span> on-chain.
                  Funds release automatically when proof is verified — or refund if expired.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Creating on XRPL...</>
              ) : (
                <><Zap className="w-5 h-5 mr-2" />Create & Lock Stake</>
              )}
            </Button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
