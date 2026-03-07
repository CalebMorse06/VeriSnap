# VeriSnap App (Next.js)

Real-world challenges with:
- **XRPL Escrow** (stake lock + settlement)
- **Pinata Private IPFS** (proof storage)
- **Gemini** (verification)

## Local run

```bash
pnpm install
cp .env.example .env.local
# fill env vars
pnpm preflight
pnpm dev
```

Open:
- App: http://localhost:3000
- Health: http://localhost:3000/api/health

## Build & start

```bash
pnpm build
pnpm start
```

## Required env vars

- `PINATA_JWT`
- `PINATA_GATEWAY` (optional but recommended)
- `GEMINI_API_KEY`
- `XRPL_SERVER`
- `XRPL_APP_WALLET_ADDRESS`
- `XRPL_APP_WALLET_SEED`

## API routes

- `POST /api/challenge/create` → creates XRPL `EscrowCreate`
- `POST /api/verify` → Pinata upload + Gemini verify + XRPL `EscrowFinish`
- `GET /api/health` → runtime configuration status
