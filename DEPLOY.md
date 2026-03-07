# VeriSnap Deployment Runbook (24h Ship)

## 1) Local preflight

```bash
cd app
pnpm install
cp .env.example .env.local
# fill all values
pnpm preflight
pnpm build
```

Health check:

```bash
pnpm dev
# open in browser
http://localhost:3000/api/health
```

You should see `ok: true`.

## 2) Vercel deploy

```bash
cd app
pnpm dlx vercel login
pnpm dlx vercel
```

When prompted:
- Framework: Next.js
- Root directory: `app`

Set env vars in Vercel Project Settings (Production + Preview):
- `PINATA_JWT`
- `PINATA_GATEWAY`
- `GEMINI_API_KEY`
- `XRPL_SERVER`
- `XRPL_APP_WALLET_ADDRESS`
- `XRPL_APP_WALLET_SEED`

Then deploy production:

```bash
pnpm dlx vercel --prod
```

## 3) Post-deploy checks

1. `GET /api/health` returns `ok: true`
2. Create challenge succeeds and returns real escrow tx hash
3. Capture + verify succeeds
4. Pass flow returns settlement tx hash (`EscrowFinish`)
5. XRPL tx links open in testnet explorer

## 4) Demo-day checklist

- Keep one browser tab at home screen
- Keep one terminal open for logs
- Have two proof images ready (pass + fail)
- If phone camera permission fails, use desktop upload fallback route (todo)
- Never rotate env keys during demo window

## 5) Production hardening after hackathon

- Move wallet signing to secure backend signer service (HSM/KMS)
- Add auth + challenge ownership checks
- Add rate limiting + abuse controls
- Add DB persistence (Postgres/Supabase) instead of sessionStorage
- Add webhook/event indexing for XRPL tx confirmations
