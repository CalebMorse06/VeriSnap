"use client";

import { useParams, useRouter } from "next/navigation";
import { ProofCapture } from "@/components/proof/ProofCapture";
import { useState } from "react";

export default function CapturePage() {
  const params = useParams();
  const router = useRouter();
  const [, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleSubmit = async (imageData: string) => {
    // Store proof data in sessionStorage for the verify flow
    sessionStorage.setItem("proofData", JSON.stringify({
      challengeId: params.id,
      imageData,
      timestamp: new Date().toISOString(),
    }));
    
    // Navigate to verification
    router.push(`/challenge/${params.id}/verify`);
  };

  return (
    <div className="h-screen flex flex-col">
      <ProofCapture
        challengeTitle="Visit the KU Campanile"
        objective="Take a clear photo showing the KU Campanile bell tower"
        onCapture={handleCapture}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
