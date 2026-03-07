# VeriSnap 🎯

**Real-world challenges. Live proof. XRP-backed outcomes.**

VeriSnap is a social challenge app where users accept real-world challenges, submit live photo proof, and resolve XRP-backed outcomes after AI verifies completion.

## 🏗️ Architecture

### Three Pillars

| Pillar | Purpose | Tech |
|--------|---------|------|
| **XRPL** | Value & Settlement | Stake-backed challenges, XRP funding/payout |
| **Pinata** | Proof Storage | Private-first IPFS uploads, reveal after verification |
| **Gemini** | Verification | AI evaluates challenge completion |

## 🚀 Quick Start

```bash
cd app
pnpm install
cp .env.example .env.local
# Fill in your API keys
pnpm dev
```

## 📱 Demo Flow

1. **View Challenge** — See the KU Campanile challenge
2. **Accept** — Commit to completing it
3. **Capture** — Take live photo proof
4. **Upload** — Proof goes to Pinata (private)
5. **Verify** — Gemini AI evaluates
6. **Resolve** — Pass/fail + XRP settlement

## 🗂️ Project Structure

```
verisnap/
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/           # Pages & routes
│   │   │   ├── page.tsx   # Home / challenge list
│   │   │   ├── challenge/[id]/
│   │   │   │   ├── page.tsx      # Challenge detail
│   │   │   │   ├── capture/      # Proof capture
│   │   │   │   ├── verify/       # Verification flow
│   │   │   │   └── result/       # Outcome screen
│   │   │   └── api/verify/       # Verification API
│   │   ├── components/    # UI components
│   │   │   ├── challenge/ # Challenge-specific
│   │   │   ├── proof/     # Proof capture
│   │   │   └── ui/        # shadcn components
│   │   ├── lib/           # Core integrations
│   │   │   ├── xrpl/      # XRPL client
│   │   │   ├── pinata/    # Pinata uploads
│   │   │   └── gemini/    # AI verification
│   │   └── types/         # TypeScript types
│   └── .env.example
└── SPEC.md                 # Product spec
```

## 🎨 Design System

- **Stack:** Next.js + TypeScript + Tailwind + shadcn/ui
- **Motion:** Framer Motion
- **Icons:** Lucide React
- **Style:** Instagram clean, Venmo clear, Snapchat camera-first

## ⚡ Challenge States

```
DRAFT → FUNDED → ACCEPTED → PROOF_SUBMITTED → VERIFYING → PASSED/FAILED → SETTLED
```

## 🔑 Environment Variables

```env
PINATA_JWT=           # Pinata API JWT
PINATA_GATEWAY=       # Your Pinata gateway
GEMINI_API_KEY=       # Google Gemini API key
XRPL_SERVER=          # XRPL testnet server
XRPL_APP_WALLET_ADDRESS=
XRPL_APP_WALLET_SEED=
```

## 📦 Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **UI:** shadcn/ui, Framer Motion, Lucide
- **Backend:** Next.js API routes
- **Blockchain:** xrpl.js (XRPL Testnet)
- **Storage:** Pinata (IPFS)
- **AI:** Google Gemini 2.0 Flash

---

Built for hackathon demo. XRPL + Pinata + Gemini.
