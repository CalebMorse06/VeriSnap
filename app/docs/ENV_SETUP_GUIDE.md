# VeriSnap Environment Setup Guide

VeriSnap requires 4 external services. All have free tiers. This guide walks you through getting each key and verifying it works.

---

## Quick Reference

```env
# Copy this to .env.local in the app root, then fill in your values

# XRPL Testnet Wallet
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_APP_WALLET_ADDRESS=rYOUR_ADDRESS_HERE
XRPL_APP_WALLET_SEED=sYOUR_SEED_HERE

# Pinata (IPFS storage)
PINATA_JWT=your_pinata_jwt_here
PINATA_GATEWAY=your-gateway.mypinata.cloud

# Google Gemini (AI verification)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (database)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 1. XRPL Testnet Wallet (free, instant, no sign-up)

**What it does:** Creates and settles escrow transactions on the XRPL testnet.

**How to get it:**

Option A - Command line (fastest):
```bash
curl -s -X POST https://faucet.altnet.rippletest.net/accounts
```
This returns JSON with `account.address` and `account.secret`. Use those as:
- `XRPL_APP_WALLET_ADDRESS` = the `address` field (starts with `r`)
- `XRPL_APP_WALLET_SEED` = the `secret` field (starts with `s`)

Option B - Browser:
1. Go to https://xrpl.org/resources/dev-tools/xrp-faucets
2. Click "Generate Testnet Credentials"
3. Copy the address and secret

**Verify it works:**
```bash
curl -s -X POST https://s.altnet.rippletest.net:51234 \
  -H "Content-Type: application/json" \
  -d '{"method":"account_info","params":[{"account":"YOUR_ADDRESS"}]}'
```
You should see `"Balance"` with ~1000 XRP (1,000,000,000 drops).

**When to re-generate:**
- If balance runs low (each challenge escrow costs the stake amount)
- Testnet resets periodically (every few months) - just generate new credentials
- If you see "Account not found" errors

---

## 2. Pinata / IPFS (free tier: 1GB storage, 100 pins)

**What it does:** Stores proof photos on IPFS so they're tamper-proof and verifiable.

**How to get it:**
1. Sign up at https://pinata.cloud (email or GitHub)
2. Go to **API Keys** in the sidebar
3. Click **+ New Key**
4. Under permissions, enable:
   - `pinFileToIPFS`
   - `pinJSONToIPFS`
5. Give it a name like "VeriSnap" and click **Create Key**
6. Copy the **JWT** (the long string) - this is your `PINATA_JWT`
7. Go to **Gateways** in the sidebar
8. Your gateway URL is shown (e.g., `salmon-tough-cat-123.mypinata.cloud`)
9. Use just the domain part as `PINATA_GATEWAY`

**Verify it works:**
```bash
curl -s https://api.pinata.cloud/data/testAuthentication \
  -H "Authorization: Bearer YOUR_JWT"
```
Should return `{"message": "Congratulations! You are communicating with the Pinata API!"}`.

**When to re-generate:**
- If you see 401 errors on proof upload
- If you accidentally exposed the JWT
- Free tier limits: regenerate if you hit 100 pins (or unpin old test data)

---

## 3. Google Gemini API Key (free tier: 60 requests/minute)

**What it does:** AI-powered photo verification. Analyzes proof photos to determine if the challenge objective was met.

**How to get it:**
1. Go to https://aistudio.google.com
2. Sign in with your Google account
3. Click **Get API Key** (top right or sidebar)
4. Click **Create API key in new project** (or select existing)
5. Copy the key - this is your `GEMINI_API_KEY`

**Verify it works:**
```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY" | head -5
```
Should return JSON with model names (not an error).

**When to re-generate:**
- If you see 403/401 errors during verification step
- If key was exposed publicly
- Free tier is generous (60 RPM) - unlikely to hit limits in demo

---

## 4. Supabase (free tier: 500MB database, 2 projects)

**What it does:** Persistent storage for challenges, proofs, and verification results.

**How to get it:**
1. Sign up at https://supabase.com (GitHub login works)
2. Click **New Project**
3. Choose a name, set a database password, pick a region
4. Wait ~2 minutes for provisioning
5. Go to **Settings** > **API** (in sidebar)
6. Copy:
   - **Project URL** -> `SUPABASE_URL` (looks like `https://abcdefg.supabase.co`)
   - **service_role key** (under "Project API keys") -> `SUPABASE_SERVICE_ROLE_KEY`
   - **Important:** Use `service_role`, NOT the `anon` key

**Run the schema:**
1. Go to **SQL Editor** in Supabase dashboard
2. Paste the contents of `supabase/schema.sql` from this repo
3. Click **Run**

Or via CLI:
```bash
# If you have psql and the Supabase connection string:
psql "postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres" -f supabase/schema.sql
```

**Verify it works:**
```bash
curl -s "YOUR_SUPABASE_URL/rest/v1/challenges?select=id&limit=1" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```
Should return `[]` (empty array) or existing challenges. Should NOT return an error.

**When to re-generate:**
- If you see "relation challenges does not exist" -> run the schema SQL again
- If 401 errors -> check you're using service_role key, not anon
- If project was paused (free tier pauses after 1 week inactive) -> go to Supabase dashboard and resume

---

## After Setup

### Local development
```bash
# Create .env.local with your values
cp .env.example .env.local
# Edit .env.local with real values

# Start dev server
pnpm dev

# Check all services are green
open http://localhost:3000
# Look at the ServiceStatus indicator in the header
```

### Deployed server (149.28.122.129)
Set the same env vars in your deployment environment. If using PM2, systemd, or Docker, ensure the env vars are passed to the Node.js process.

### Health check
Once running, hit `/api/health` to verify:
```bash
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "ok": true,
  "pinataConfigured": true,
  "geminiConfigured": true,
  "xrplConfigured": true,
  "supabaseConfigured": true
}
```

Any `false` value means that service's env var is missing or wrong.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Create page infinite spinner | Missing XRPL credentials | Set `XRPL_APP_WALLET_ADDRESS` and `XRPL_APP_WALLET_SEED` |
| "XRPL testnet is slow" timeout | Testnet congestion or wallet unfunded | Re-generate wallet from faucet |
| Proof upload fails | Missing or expired Pinata JWT | Regenerate Pinata API key |
| Verification returns no result | Missing Gemini key | Get new key from AI Studio |
| Challenges don't persist | Missing Supabase config or schema | Check URL/key, run schema.sql |
| ServiceStatus shows "Offline" | Server can't reach /api/health | Check if app is running, env vars set |
| All services red after redeploy | Env vars not loaded | Restart the process after setting env |
