#!/bin/bash
# Development/Staging Deployment Script
# This script deploys to development environment for testing

set -e

echo "================================================"
echo "🔧 SNS Report Generator - Development Deployment"
echo "================================================"
echo ""

# Step 1: Build application
echo "🔨 Step 1/3: Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build completed"
echo ""

# Step 2: Apply database migrations (development)
echo "🗄️  Step 2/3: Applying database migrations to development..."
npx wrangler d1 migrations apply sns-report-development --remote
if [ $? -ne 0 ]; then
    echo "⚠️  Migration warning (may already be applied)"
fi
echo "✅ Development database updated"
echo ""

# Step 3: Deploy to development branch
echo "☁️  Step 3/3: Deploying to development environment..."
npx wrangler pages deploy dist --project-name sns-report-generator --branch development
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi
echo "✅ Deployment completed"
echo ""

# Success message
echo "================================================"
echo "🎉 Development Deployment Successful!"
echo "================================================"
echo ""
echo "📍 Your development environment is live at:"
echo "   https://development.sns-report-generator.pages.dev"
echo ""
echo "💡 Test your changes before deploying to production:"
echo "   npm run deploy:prod"
echo ""
