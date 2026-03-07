# VeriSnap Morning Runbook

Use this when you wake up to validate and demo quickly.

## 1) Go to project
```bash
cd ~/clawd/projects/verisnap/app
```

## 2) Full morning gate (one command)
```bash
pnpm morning
```
What this does:
- strict readiness snapshot (`VERISNAP_DEMO_STRICT=1`)
- full demo verification (`pnpm verify-demo`)

## 3) (Optional) Run demo verification directly
```bash
pnpm verify-demo
```
What this does:
- env preflight
- prod build
- starts dev server
- smoke checks
- privacy checks

## 4) Quick readiness snapshot
```bash
pnpm demo-status

# Optional strict gate (fails if pending settlements > 0)
VERISNAP_DEMO_STRICT=1 pnpm demo-status
```

## 5) Optional: retry any pending XRPL settlements
```bash
pnpm retry-settlements
```

## 6) Start app for live walkthrough
```bash
pnpm dev
```
Open: http://localhost:3000

## 7) 90-second demo order
1. Create challenge (show escrow lock)
2. Accept challenge (timer starts)
3. Capture proof (private)
4. Verify (Pinata → Gemini → XRPL)
5. Result (confidence + tx)
6. Share option (private/friends/public)
7. Public feed (if revealed)

## 8) If anything fails
- XRPL settlement pending: run `pnpm retry-settlements`
- API sanity: `pnpm smoke`
- Privacy sanity: `pnpm privacy-check`
- Full check: `pnpm verify-demo`

## 9) Judge talking points (quick)
- XRPL escrow is real testnet tx, not mocked
- Proof is private by default and owner-controlled reveal
- AI verification includes fraud-aware checks
- Ops reliability: one-command verification + retry tooling
