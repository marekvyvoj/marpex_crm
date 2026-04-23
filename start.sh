#!/bin/bash
set -e

echo "🚀 Starting Marpex CRM on Railway..."

cd 06_IMPLEMENTATION

echo "📦 Installing dependencies..."
npm install --omit=dev

echo "🔄 Running database migrations..."
npm run db:migrate

echo "🏗️ Building application..."
npm run build

echo "✅ Starting server..."
npm run start
