# VeriSnap Demo Playbook (Judge-Ready)

## Goal
Show a **real, trustless challenge lifecycle** with three visible pillars:
1. XRPL Escrow (value lock + settlement)
2. Pinata Private IPFS (proof custody)
3. Gemini AI (objective verification)

---

## Pre-Demo Checklist (2-3 min)

```bash
cd app
pnpm verify-demo
```

Expected:
- preflight ✅
- build ✅
- smoke ✅
- privacy-check ✅

Open:
- App: http://localhost:3000
- Health: http://localhost:3000/api/health

---

## 90-Second Script

### 1) Create (15s)
- Open **New Challenge**
- Select preset (e.g. KU Campanile)
- Create challenge
- Narrate: "Stake is locked in XRPL escrow now — creator can't back out"

### 2) Accept (10s)
- Open challenge detail → Accept
- Narrate timer + risk: "Timer starts immediately; stake is at risk"

### 3) Capture (15s)
- Capture proof photo
- Narrate: "Proof is private first; not public feed content yet"

### 4) Verify (25s)
- Show 3-step verification screen:
  - Uploading (Pinata)
  - AI verification (Gemini)
  - Settlement (XRPL)
- Narrate: "AI checks objective + fraud indicators"

### 5) Result + Reveal (25s)
- Show pass/fail card + confidence
- Show transaction/proof references
- Use share options: private/friends/public
- If public, open Feed page

---

## If Something Fails (Recovery Lines)

### XRPL settlement delay/failure
- Expected UX: "Settlement Pending" state
- Line: "Verification completed; settlement retries automatically with integrity preserved."

### Pinata upload/API hiccup
- Line: "Proof never bypasses custody rules — user can retake/retry without leaking data."

### Gemini uncertainty/low confidence
- Line: "Verifier is strict by design when money is at stake. Better false-negative than false-positive."

### Empty feed
- Line: "Public posting is optional by design. This protects user privacy and avoids forced social behavior."

---

## Key Judge Talking Points

- **Not fake demo wiring**: real XRPL testnet escrow create/finish flow
- **Privacy by default**: proof private during verification, reveal only by owner choice
- **Fraud-aware AI**: screenshot/photo-of-photo detection cues in verification rubric
- **Operational maturity**: one-command verification (`pnpm verify-demo`)

---

## Architecture One-Liner

"VeriSnap turns social challenges into enforceable outcomes: stake locked on XRPL, proof held privately on Pinata, and objective resolution by Gemini with explicit reveal controls."

---

## Nice-to-Have Live Enhancements (if time)

1. Location consistency scoring (objective vs metadata/location hints)
2. Settlement retry queue UI for operators
3. Public feed ranking by confidence + stake
4. Explicit event log timeline on result page
