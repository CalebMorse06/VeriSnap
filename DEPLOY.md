# VeriSnap Deployment Runbook

## Prerequisites

- Supabase project created
- Pinata account with JWT
- Gemini API key  
- XRPL testnet wallet (funded)
- Vultr account (optional, for full infra)

---

## 1) Local Development

```bash
cd app
pnpm install
cp .env.example .env.local
# Fill all env vars
pnpm preflight
pnpm dev
```

Health check: http://localhost:3000/api/health → `ok: true`

---

## 2) Supabase Setup

1. Create project at https://supabase.com
2. Go to SQL Editor
3. Run schema from `app/supabase/schema.sql`:

```sql
-- Paste contents of app/supabase/schema.sql
```

4. Get credentials from Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (not anon key)

---

## 3) Environment Variables

Required in `.env.local` (local) or Vercel/Vultr (production):

```env
# Pinata
PINATA_JWT=eyJ...
PINATA_GATEWAY=gateway.pinata.cloud

# Gemini
GEMINI_API_KEY=AI...

# XRPL Testnet
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_APP_WALLET_ADDRESS=r...
XRPL_APP_WALLET_SEED=s...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 4a) Deploy to Vercel (fastest)

```bash
cd app
pnpm dlx vercel login
pnpm dlx vercel
# Set env vars in Vercel dashboard
pnpm dlx vercel --prod
```

---

## 4b) Deploy to Vultr (full control)

### Option A: Docker on Vultr Compute

1. Create Vultr Cloud Compute instance (Ubuntu 24.04, 2GB+ RAM)

2. SSH in and install Docker:
```bash
ssh root@YOUR_IP
curl -fsSL https://get.docker.com | sh
```

3. Clone repo and deploy:
```bash
git clone https://github.com/YOUR_USER/verisnap.git
cd verisnap

# Create env file
cat > app/.env.local << 'EOF'
PINATA_JWT=...
PINATA_GATEWAY=gateway.pinata.cloud
GEMINI_API_KEY=...
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_APP_WALLET_ADDRESS=...
XRPL_APP_WALLET_SEED=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
EOF

# Build and run
docker compose up -d --build
```

4. App runs on port 3000. Set up reverse proxy (nginx/caddy) for HTTPS.

### Option B: Direct Node.js on Vultr

```bash
# Install Node
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install pnpm
npm i -g pnpm

# Clone and build
git clone https://github.com/YOUR_USER/verisnap.git
cd verisnap/app
pnpm install
# Create .env.local with vars above
pnpm build

# Run with PM2
npm i -g pm2
pm2 start "pnpm start" --name verisnap
pm2 save
pm2 startup
```

---

## 5) Post-Deploy Checklist

- [ ] `GET /api/health` returns `ok: true`
- [ ] Create challenge → returns escrow tx hash
- [ ] Accept challenge → timer starts
- [ ] Capture proof → camera works
- [ ] Verify → Gemini returns verdict
- [ ] Result → shows verification trail + settlement tx
- [ ] XRPL explorer links work

---

## 6) Demo Script (90 seconds)

1. **Create** (15s): "Visit KU Campanile, 20 XRP stake" → Show escrow lock
2. **Accept** (5s): Timer starts, stake at risk
3. **Capture** (15s): Take photo, see "Ready to upload to Pinata"
4. **Verify** (20s): Watch three-step progress (Pinata → Gemini → XRPL)
5. **Result** (20s): Show verification trail, tx links, confetti on pass
6. **Explain** (15s): "Real XRPL escrow, private IPFS proof, AI-verified, trustless settlement"

---

## Production Hardening (Post-Hackathon)

- [ ] Move wallet signing to HSM/KMS
- [ ] Add user auth (Passkey/WebAuthn)
- [ ] Add rate limiting at edge (Cloudflare)
- [ ] Add observability (Sentry, LogFlare)
- [ ] Add DB connection pooling
- [ ] Add challenge ownership enforcement
- [ ] Add terms of service
