import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(500),
  objective: z.string().min(5).max(500),
  location: z.object({
    name: z.string().min(2).max(200),
    lat: z.number(),
    lng: z.number(),
  }),
  stakeAmountXrp: z.number().positive().max(1000),
  durationMinutes: z.number().int().min(1).max(24 * 60),
});

export const verifySchema = z.object({
  challengeId: z.string().min(1),
  imageData: z.string().min(100),
  challengeObjective: z.string().min(3),
  participantAddress: z.string().optional(),
  escrowOwner: z.string().optional(),
  escrowSequence: z.number().int().nonnegative().optional(),
  capturedAt: z.number().int().positive().optional(),
  acceptedAt: z.number().int().positive().optional(),
});
