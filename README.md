# VeriSnap

**Real-world challenges. Live proof. XRP-backed outcomes.**

VeriSnap is a social challenge app where users stake XRP, complete real-world tasks, submit photo proof, and receive AI-verified, trustless settlement. Built for hackathon demo with production-grade architecture.

---

## 🏗 Architecture

VeriSnap integrates three pillars:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Value** | XRPL Escrow | Stake locks on-chain via `EscrowCreate`, releases via `EscrowFinish` |
| **Proof** | Pinata IPFS | Photos upload privately, verifier gets scoped access link |
| **Verification** | Gemini 2.0 Flash | AI analyzes proof against objective, detects fraud |

```
User creates challenge → XRPL EscrowCreate (stake locked)
                              ↓
User accepts challenge → Timer starts
                              ↓
User captures proof → Private upload to Pinata IPFS
                              ↓
                    Gemini AI verification (fraud detection)
                              ↓
          Pass → EscrowFinish (stake released) 
          Fail → Stake forfeited
```

---

## 🎯 Demo Flow (90 seconds)

1. **Create** (15s) — Pick a challenge preset, see XRPL escrow transaction
2. **Accept** (5s) — Timer starts, stake locked
3. **Capture** (15s) — Camera opens, capture proof photo
4. **Verify** (25s) — Watch three-step progress: Pinata → Gemini → XRPL
5. **Result** (15s) — See verification trail, share options
6. **Feed** (15s) — View public challenges from other users

---

## 🔐 Trust Features

### Fraud Detection
- AI checks for screenshots, photos-of-photos, printouts
- Timestamp validation (proof must be recent)
- Challenge timer enforcement

### Privacy-First
- Proof uploads are private by default
- User chooses visibility: Private / Friends / Public
- Proof only revealed after resolution

### On-Chain Settlement
- Real XRPL testnet transactions
- Escrow locked at challenge creation
- Automatic release on verified pass

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind 4, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes, Zod validation, rate limiting
- **Blockchain:** xrpl.js (XRPL Testnet)
- **Storage:** Pinata SDK (Private IPFS)
- **AI:** Google Gemini 2.0 Flash
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Docker, Vultr-ready

---

## 🚀 Quick Start

```bash
cd app
pnpm install
cp .env.example .env.local
# Fill in: PINATA_JWT, GEMINI_API_KEY, XRPL_*, SUPABASE_*
pnpm dev
```

Health check: http://localhost:3000/api/health

### Morning demo commands

```bash
# One-command demo validation (build + health + smoke + privacy)
pnpm verify-demo

# Instant readiness snapshot (health + pending settlement backlog)
pnpm demo-status

# Retry any pending XRPL settlements for PASSED challenges
pnpm retry-settlements
```

Full step-by-step run guide: `../MORNING_RUNBOOK.md`

---

## 📁 Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── challenge/     # Create challenge
│   │   │   ├── challenges/    # List/get/update
│   │   │   ├── feed/          # Public feed
│   │   │   ├── verify/        # Proof verification
│   │   │   └── health/        # Service status
│   │   ├── challenge/[id]/    # Challenge pages
│   │   └── feed/              # Public feed page
│   ├── components/            # React components
│   ├── lib/                   # Core libraries
│   │   ├── gemini/           # AI verification
│   │   ├── pinata/           # IPFS upload
│   │   ├── xrpl/             # Escrow operations
│   │   ├── proof-validation/ # Timestamp/fraud checks
│   │   └── store/            # Client state
│   └── styles/               # Design system
├── public/                    # Static assets
└── supabase/                 # Database schema
```

---

## 🔑 Environment Variables

```env
# Pinata (IPFS)
PINATA_JWT=...
PINATA_GATEWAY=gateway.pinata.cloud

# Gemini (AI)
GEMINI_API_KEY=...

# XRPL Testnet
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_APP_WALLET_ADDRESS=...
XRPL_APP_WALLET_SEED=...

# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service status |
| `/api/challenge/create` | POST | Create challenge + escrow |
| `/api/challenges` | GET/POST | List/create challenges |
| `/api/challenges/[id]` | GET/PATCH | Get/update challenge |
| `/api/challenges/[id]/reveal` | POST | Update visibility |
| `/api/verify` | POST | Verify proof + settle |
| `/api/feed` | GET | Public completed challenges |

---

## 🎨 Design System

Premium, restrained, trustworthy — not crypto/AI aesthetic.

- **Background:** Off-white `#fafafa`
- **Accent:** Deep emerald `#059669` (CTAs only)
- **Success:** Bright green `#22c55e` (verified only)
- **Error:** Muted red `#dc2626` (failed only)
- **Warning:** Amber `#f59e0b` (timers)

---

## 📜 License

MIT — Built for hackathon demonstration.

---

## 🏆 Hackathon Tracks

VeriSnap demonstrates integration across:

1. **XRPL** — Escrow-based challenge staking
2. **Pinata** — Private proof storage with scoped access
3. **Gemini AI** — Objective verification with fraud detection

All three pillars are essential to the app's function, not bolted on.
