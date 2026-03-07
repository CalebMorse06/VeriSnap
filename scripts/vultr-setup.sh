#!/bin/bash
# VeriSnap Vultr Quick Setup
# Run on fresh Ubuntu 24.04 instance

set -e

echo "🚀 VeriSnap Vultr Setup"

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Clone repo if not exists
if [ ! -d "verisnap" ]; then
    echo "📥 Cloning VeriSnap..."
    git clone https://github.com/YOUR_USER/verisnap.git
fi

cd verisnap

# Check for env file
if [ ! -f "app/.env.local" ]; then
    echo "⚠️  Missing app/.env.local"
    echo "Create it with your credentials:"
    echo ""
    cat << 'EOF'
PINATA_JWT=...
PINATA_GATEWAY=gateway.pinata.cloud
GEMINI_API_KEY=...
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_APP_WALLET_ADDRESS=...
XRPL_APP_WALLET_SEED=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
EOF
    echo ""
    exit 1
fi

# Build and start
echo "🔨 Building and starting VeriSnap..."
docker compose up -d --build

echo ""
echo "✅ VeriSnap is running!"
echo "   Health: http://$(hostname -I | awk '{print $1}'):3000/api/health"
echo ""
echo "Next: Set up nginx/caddy for HTTPS"
