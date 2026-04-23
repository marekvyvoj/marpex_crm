#!/bin/bash
set -e

echo "🚀 Starting Marpex CRM on Railway..."

cd 06_IMPLEMENTATION

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building application..."
npm -w packages/domain run build
npm -w apps/api run build

echo "✅ Starting server..."
npm -w apps/api run start
