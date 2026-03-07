# VeriSnap Deploy Checklist (Vercel-first)

## 0) Prereq
- Repo up to date on `main`
- Local gate passed: `pnpm morning`

## 1) Vercel project setup
- Root directory: `projects/verisnap/app`
- Framework: Next.js (auto)
- Build command: `pnpm build`
- Install command: `pnpm install`

## 2) Environment variables (Production)
Set all of the following in Vercel Project Settings → Environment Variables:

```env
PINATA_JWT=
PINATA_GATEWAY=gateway.pinata.cloud

GEMINI_API_KEY=

XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_APP_WALLET_ADDRESS=
XRPL_APP_WALLET_SEED=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## 3) Deploy
- Trigger deploy from latest `main`
- Wait until build is green

## 4) Post-deploy smoke (required)
Replace `<APP_URL>` with production URL.

```bash
curl -sS <APP_URL>/api/health
curl -sS <APP_URL>/api/challenges
curl -sS <APP_URL>/api/feed
```

Expected:
- `/api/health` => `ok: true`
- challenges/feed return success payloads

## 5) Post-deploy app flow (manual)
1. Create challenge
2. Accept
3. Capture proof
4. Verify
5. Confirm result page shows confidence and references

## 6) If settlement appears pending
- On operator shell (with envs available):
```bash
cd ~/clawd/projects/verisnap/app
pnpm retry-settlements
```

## 7) Rollback rule
If health check fails or verify flow breaks:
- Revert to previous successful Vercel deployment immediately
- Do not continue live demo on broken build
