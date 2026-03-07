"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RotateCcw, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProofCaptureProps {
  onCapture: (imageData: string) => void;
  onSubmit: (imageData: string) => Promise<void>;
  challengeTitle: string;
  objective: string;
}

export function ProofCapture({ onCapture, onSubmit, challengeTitle, objective }: ProofCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
        onCapture(imageData);
        // Stop camera
        stream?.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }
    }
  }, [stream, onCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleSubmit = async () => {
    if (!capturedImage) return;
    setIsSubmitting(true);
    try {
      await onSubmit(capturedImage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-zinc-900 text-white">
        <h2 className="text-lg font-semibold">{challengeTitle}</h2>
        <p className="text-sm text-zinc-400 mt-1">{objective}</p>
      </div>

      {/* Camera / Preview area */}
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="hidden" />
        
        <AnimatePresence mode="wait">
          {!cameraActive && !capturedImage && (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Button size="lg" onClick={startCamera} className="gap-2">
                <Camera className="w-5 h-5" />
                Start Camera
              </Button>
            </motion.div>
          )}

          {cameraActive && (
            <motion.video
              key="video"
              ref={videoRef}
              autoPlay
              playsInline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {capturedImage && (
            <motion.img
              key="preview"
              src={capturedImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Captured proof"
            />
          )}
        </AnimatePresence>

        {/* Capture overlay */}
        {cameraActive && (
          <div className="absolute bottom-0 inset-x-0 p-6 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={capture}
              className="w-20 h-20 rounded-full bg-white border-4 border-zinc-300 shadow-lg flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {capturedImage && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="p-4 bg-white border-t flex gap-3"
        >
          <Button variant="outline" onClick={retake} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Retake
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Submit Proof
          </Button>
        </motion.div>
      )}
    </div>
  );
}
