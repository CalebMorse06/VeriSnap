# VeriSnap — Hackathon Demo Spec

## Core Product
Social challenge app where users accept real-world challenges, submit live proof, and resolve XRP-backed outcomes after AI verifies completion.

## Three Pillars
1. **XRPL** = Value layer (stake-backed challenges, XRP funding/settlement)
2. **Pinata** = Proof layer (private-first uploads, reveal after verification)
3. **Gemini** = Verification layer (AI evaluates challenge completion)

## Demo Challenge: KU Campanile
Location-based proof challenge — the demo objective, not the product.

## Challenge Flow
1. Create challenge
2. Fund/back with XRP
3. Accept challenge
4. Complete real-world objective
5. Submit live proof
6. Verify with Gemini
7. Resolve result
8. Optional: reveal in feed

## Challenge States
DRAFT → FUNDED → ACCEPTED → PROOF_SUBMITTED → VERIFYING → PASSED/FAILED → SETTLED → EXPIRED

## Required Screens
- Home / challenge list
- Challenge detail
- Accept challenge
- Live proof capture
- Verifying screen
- Result screen
- Optional: completed challenges feed

## Tech Stack
- Next.js + TypeScript + Tailwind + shadcn/ui
- Framer Motion + Lucide + React Hook Form + Zod
- xrpl.js + Pinata SDK + Google GenAI SDK
- Supabase or simple Postgres

## Design Direction
Instagram cleanliness + Venmo clarity + Snapchat camera-first
Modern, minimal, rounded, mobile-first feel

## Cut Order (if time tight)
1. Feed polish
2. Extra animations
3. Multiple templates
4. Deep chain sophistication
5. Anti-cheat
6. Profile features

## Do NOT Cut
- Challenge flow
- Live proof capture
- Pinata upload
- Gemini verification
- XRP-backed state
- Polished result screen
