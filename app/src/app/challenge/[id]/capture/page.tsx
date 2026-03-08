"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, X, Clock, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { updateChallenge, getChallenge, saveChallenge, ChallengeData } from "@/lib/store/challenges";
import { TrustBadge } from "@/components/ui/trust-badge";
import { Button } from "@/components/ui/button";
import { validateProofImage } from "@/lib/proof-validation";

type CaptureState = "initializing" | "ready" | "countdown" | "captured" | "error";

export default function CapturePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<ChallengeData | null>(getChallenge(challengeId));

  // Fetch from server if not in local storage (cross-device)
  useEffect(() => {
    if (challenge) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${challengeId}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success && json.challenge) {
          const c = json.challenge;
          const mapped: ChallengeData = {
            id: c.id, title: c.title, description: c.description, objective: c.objective,
            location: { name: c.location_name, lat: c.location_lat, lng: c.location_lng },
            stakeAmount: c.stake_amount_drops, durationMinutes: c.duration_minutes,
            creatorAddress: c.escrow_owner || c.creator_id, status: c.status,
            visibility: c.visibility || "private", createdAt: new Date(c.created_at).getTime(),
            expiresAt: new Date(c.expires_at).getTime(),
            escrowTxHash: c.escrow_tx_hash || undefined, escrowSequence: c.escrow_sequence || undefined,
            escrowOwner: c.escrow_owner || undefined,
          };
          setChallenge(mapped);
          saveChallenge(mapped);
        }
      } catch (err) { console.warn("[CapturePage] Server fetch failed:", err); }
    })();
    return () => { mounted = false; };
  }, [challenge, challengeId]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [state, setState] = useState<CaptureState>("initializing");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load challenge timer if exists
  useEffect(() => {
    const stored = sessionStorage.getItem("challengeAccepted");
    if (stored) {
      const { expiresAt } = JSON.parse(stored);
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setState("ready");
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please grant permission.");
      setState("error");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const flipCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const startCountdown = () => {
    setState("countdown");
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    const timestamp = Date.now();
    
    setCapturedImage(imageData);
    setCapturedAt(timestamp);
    setState("captured");
    setValidationError(null);

    // Validate immediately
    const validation = validateProofImage(imageData, timestamp);
    if (!validation.valid) {
      setValidationError(validation.errors[0]);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedAt(null);
    setValidationError(null);
    setState("initializing");
    startCamera();
  };

  const submitProof = () => {
    if (!capturedImage || !capturedAt) return;

    // Final validation check
    const validation = validateProofImage(capturedImage, capturedAt);
    if (!validation.valid) {
      setValidationError(validation.errors[0]);
      return;
    }

    // Store proof data with timestamps
    const acceptedData = sessionStorage.getItem("challengeAccepted");
    const acceptedAt = acceptedData ? JSON.parse(acceptedData).acceptedAt : undefined;

    sessionStorage.setItem("proofData", JSON.stringify({
      challengeId,
      imageData: capturedImage,
      capturedAt,
      acceptedAt,
    }));

    updateChallenge(challengeId, { status: "PROOF_SUBMITTED" });
    router.push(`/challenge/${challengeId}/verify`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpired = timeRemaining !== null && timeRemaining <= 0;

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Timer bar */}
      {timeRemaining !== null && (
        <div className={`px-4 py-3 flex items-center justify-between ${
          isExpired ? "bg-red-600" : timeRemaining < 60 ? "bg-amber-500" : "bg-emerald-600"
        }`}>
          <span className="text-white text-sm font-medium">
            {isExpired ? "Time expired" : timeRemaining < 60 ? "Hurry!" : "Time remaining"}
          </span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="font-mono font-bold text-white">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Camera view */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            facingMode === "user" ? "scale-x-[-1]" : ""
          } ${state === "captured" ? "hidden" : ""}`}
        />

        {/* Captured image */}
        {capturedImage && state === "captured" && (
          <div className="absolute inset-0">
            <img
              src={capturedImage}
              alt="Captured proof"
              className="w-full h-full object-cover"
            />
            {/* Badge */}
            <div className="absolute top-4 left-4">
              <TrustBadge variant="private" size="sm" animated={false} showIcon />
            </div>
            {/* Status */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
              <div className="px-4 py-2 rounded-lg bg-zinc-900/80 backdrop-blur-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <p className="text-white text-sm font-medium">
                  Ready for private upload
                </p>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Loading */}
        {state === "initializing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <img
                src="/illustrations/camera-viewfinder.jpg"
                alt="Initializing camera"
                className="w-24 h-24 mx-auto mb-3 rounded-xl opacity-60 animate-pulse object-contain"
                draggable={false}
              />
              <p className="text-zinc-400 text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-6">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Camera Access Required</p>
              <p className="text-zinc-400 text-sm mb-4">{error}</p>
              <Button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Countdown */}
        <AnimatePresence>
          {state === "countdown" && countdown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-7xl font-bold text-white"
              >
                {countdown}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flash */}
        <AnimatePresence>
          {state === "countdown" && countdown === 0 && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white"
            />
          )}
        </AnimatePresence>

        {/* Guide frame */}
        {state === "ready" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border-2 border-white/20 rounded-xl">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-lg" />
            </div>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-sm px-4 py-2 rounded-lg max-w-xl">
              <p className="text-white text-base font-medium">
                {challenge?.objective || "Frame your proof clearly"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 p-6 pb-10 safe-area-inset-bottom">
        {/* Validation error */}
        {validationError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{validationError}</p>
          </div>
        )}

        {state === "ready" && !isExpired && (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={flipCamera}
              className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={startCountdown}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/20"
            >
              <div className="w-16 h-16 rounded-full bg-white border-4 border-zinc-900" />
            </button>

            <div className="w-12 h-12" />
          </div>
        )}

        {isExpired && state !== "captured" && (
          <div className="text-center">
            <p className="text-red-400 font-medium mb-4">Time expired — challenge failed</p>
            <Button 
              variant="outline" 
              className="border-zinc-700 text-white"
              onClick={() => router.push("/")}
            >
              Return Home
            </Button>
          </div>
        )}

        {state === "captured" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              onClick={retake}
            >
              <X className="w-4 h-4" />
              Retake
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={submitProof}
              disabled={!!validationError}
            >
              Submit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
