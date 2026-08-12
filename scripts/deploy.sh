#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting CLI Deployment Procedure..."

# 1. Verify Node/npx
if ! command -v npx &> /dev/null; then
    echo "❌ Error: Node.js (npx) is not installed."
    exit 1
fi

# 2. Extract Project info if available
PROJECT_ID=""
PROJECT_NAME=""
if [ -f ".vercel/repo.json" ]; then
    PROJECT_ID=$(grep -E '"id":' .vercel/repo.json | head -n 1 | cut -d'"' -f4)
    PROJECT_NAME=$(grep -E '"name":' .vercel/repo.json | head -n 1 | cut -d'"' -f4)
fi

if [ ! -z "$PROJECT_NAME" ]; then
    echo "📌 Vercel Project: $PROJECT_NAME (ID: $PROJECT_ID)"
else
    # 3. Check if linked to Vercel if repo.json doesn't exist
    if [ ! -d ".vercel" ]; then
        echo "🔗 Project not linked. Linking to Vercel..."
        npx vercel link
    fi
fi

# Prepare project parameter for Vercel commands
PROJECT_PARAM=""
if [ ! -z "$PROJECT_NAME" ]; then
    PROJECT_PARAM="--project $PROJECT_NAME"
fi

# 4. Read and sync env variables from .env.local
if [ -f ".env.local" ]; then
    echo "🔑 Syncing environment variables to Vercel (Production/Preview)..."
    
    # List of variables we want to sync
    VARS=("AUTH_SECRET" "GOOGLE_GENERATIVE_AI_API_KEY" "GEMINI_API_KEY" "GEMINI_MODEL" "POSTGRES_URL")
    
    for VAR in "${VARS[@]}"; do
        # Extract value from .env.local (removing outer quotes if present)
        VALUE=$(grep -E "^${VAR}=" .env.local | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        if [ ! -z "$VALUE" ]; then
            echo "⚡ Syncing $VAR..."
            npx vercel env add "$VAR" production,preview --value "$VALUE" --yes --force $PROJECT_PARAM
        fi
    done
else
    echo "⚠️ Warning: .env.local not found. Skipping environment variable sync."
fi

# 5. Run database migrations before deployment
echo "🗄️ Running database migrations..."
pnpm tsx db/migrate

# 6. Deploy to Production
echo "🛫 Deploying to Vercel Production..."
npx vercel deploy --prod --yes $PROJECT_PARAM

echo "✅ Deployment completed successfully!"
