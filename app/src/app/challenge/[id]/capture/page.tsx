"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, X, Clock, AlertCircle, Zap, Upload } from "lucide-react";
import { updateChallenge } from "@/lib/store/challenges";
import { TrustBadge } from "@/components/ui/trust-badge";
import { Button } from "@/components/ui/button";

type CaptureState = "initializing" | "ready" | "countdown" | "captured" | "error";

export default function CapturePage() {
  const params = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [state, setState] = useState<CaptureState>("initializing");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

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
      // Stop existing stream
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
    
    // Mirror if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    setState("captured");

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setState("initializing");
    startCamera();
  };

  const submitProof = () => {
    if (!capturedImage) return;

    // Store proof data
    const challengeId = params.id as string;
    sessionStorage.setItem("proofData", JSON.stringify({
      challengeId,
      imageData: capturedImage,
      capturedAt: Date.now(),
    }));

    updateChallenge(challengeId, { status: "PROOF_SUBMITTED" });
    router.push(`/challenge/${challengeId}/verify`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Timer bar */}
      {timeRemaining !== null && (
        <div className={`px-4 py-2 flex items-center justify-center gap-2 ${
          timeRemaining < 60 ? "bg-red-600" : "bg-zinc-800"
        }`}>
          <Clock className="w-4 h-4 text-white" />
          <span className={`font-mono font-bold ${
            timeRemaining < 60 ? "text-white animate-pulse" : "text-white"
          }`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}

      {/* Camera view */}
      <div className="flex-1 relative">
        {/* Video feed */}
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
            <div className="absolute top-4 left-4">
              <TrustBadge variant="private" size="sm" animated={false} />
            </div>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
              <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <p className="text-white text-sm font-medium">
                  Ready to upload to Pinata
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading overlay */}
        {state === "initializing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Camera className="w-12 h-12 text-zinc-400 mx-auto mb-3 animate-pulse" />
              <p className="text-zinc-400">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {state === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Camera Access Required</p>
              <p className="text-zinc-400 text-sm mb-4">{error}</p>
              <Button onClick={startCamera}>Try Again</Button>
            </div>
          </div>
        )}

        {/* Countdown overlay */}
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
                className="text-8xl font-bold text-white"
              >
                {countdown}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flash effect */}
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
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
            </div>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">
                Frame the KU Campanile clearly
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black p-6 pb-10 safe-area-inset-bottom">
        {state === "ready" && (
          <div className="flex items-center justify-center gap-6">
            {/* Flip camera */}
            <button
              onClick={flipCamera}
              className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>

            {/* Capture button */}
            <button
              onClick={startCountdown}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30"
            >
              <div className="w-16 h-16 rounded-full bg-white border-4 border-zinc-900" />
            </button>

            {/* Spacer */}
            <div className="w-12 h-12" />
          </div>
        )}

        {state === "captured" && (
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              onClick={retake}
            >
              <X className="w-5 h-5" />
              Retake
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              onClick={submitProof}
            >
              <Zap className="w-5 h-5" />
              Submit Proof
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
