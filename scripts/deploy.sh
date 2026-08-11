#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting CLI Deployment Procedure..."

# 1. Verify Node/npx
if ! command -v npx &> /dev/null; then
    echo "❌ Error: Node.js (npx) is not installed."
    exit 1
fi

# 2. Check if linked to Vercel
if [ ! -d ".vercel" ]; then
    echo "🔗 Project not linked. Linking to Vercel..."
    npx vercel link
fi

# 3. Read and sync env variables from .env.local
if [ -f ".env.local" ]; then
    echo "🔑 Syncing environment variables to Vercel (Production/Preview)..."
    
    # List of variables we want to sync
    VARS=("AUTH_SECRET" "GOOGLE_GENERATIVE_AI_API_KEY" "GEMINI_MODEL" "POSTGRES_URL")
    
    for VAR in "${VARS[@]}"; do
        # Extract value from .env.local (removing outer quotes if present)
        VALUE=$(grep -E "^${VAR}=" .env.local | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        if [ ! -z "$VALUE" ]; then
            echo "⚡ Syncing $VAR..."
            npx vercel env add "$VAR" production,preview --value "$VALUE" --yes --force
        fi
    done
else
    echo "⚠️ Warning: .env.local not found. Skipping environment variable sync."
fi

# 4. Run database migrations before deployment
echo "🗄️ Running database migrations..."
pnpm tsx db/migrate

# 5. Deploy to Production
echo "🛫 Deploying to Vercel Production..."
npx vercel deploy --prod --yes

echo "✅ Deployment completed successfully!"
