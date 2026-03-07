# VeriSnap Morning Runbook

Use this when you wake up to validate and demo quickly.

## 1) Go to project
```bash
cd ~/clawd/projects/verisnap/app
```

## 2) Full demo verification (one command)
```bash
pnpm verify-demo
```
What this does:
- env preflight
- prod build
- starts dev server
- smoke checks
- privacy checks

## 3) Optional: retry any pending XRPL settlements
```bash
pnpm retry-settlements
```

## 4) Start app for live walkthrough
```bash
pnpm dev
```
Open: http://localhost:3000

## 5) 90-second demo order
1. Create challenge (show escrow lock)
2. Accept challenge (timer starts)
3. Capture proof (private)
4. Verify (Pinata → Gemini → XRPL)
5. Result (confidence + tx)
6. Share option (private/friends/public)
7. Public feed (if revealed)

## 6) If anything fails
- XRPL settlement pending: run `pnpm retry-settlements`
- API sanity: `pnpm smoke`
- Privacy sanity: `pnpm privacy-check`
- Full check: `pnpm verify-demo`

## 7) Judge talking points (quick)
- XRPL escrow is real testnet tx, not mocked
- Proof is private by default and owner-controlled reveal
- AI verification includes fraud-aware checks
- Ops reliability: one-command verification + retry tooling
