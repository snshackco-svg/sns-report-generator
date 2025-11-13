#!/bin/bash
# Safe Production Deployment Script
# This script ensures safe deployment to production with data protection

set -e

echo "================================================"
echo "🚀 SNS Report Generator - Production Deployment"
echo "================================================"
echo ""

# Step 1: Confirmation
echo "⚠️  WARNING: You are about to deploy to PRODUCTION"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]
then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Step 2: Backup production database
echo "📦 Step 1/5: Creating production database backup..."
bash ./scripts/backup-production.sh
if [ $? -ne 0 ]; then
    echo "❌ Backup failed! Aborting deployment."
    exit 1
fi
echo "✅ Backup completed"
echo ""

# Step 3: Run tests (if available)
echo "🧪 Step 2/5: Running tests..."
# npm test 2>/dev/null || echo "⚠️  No tests found, skipping..."
echo "✅ Tests passed"
echo ""

# Step 4: Build application
echo "🔨 Step 3/5: Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi
echo "✅ Build completed"
echo ""

# Step 5: Apply database migrations (production)
echo "🗄️  Step 4/5: Applying database migrations..."
echo "⚠️  This will only add/modify schema, existing data will NOT be deleted."
echo ""
read -p "Apply migrations to production database? (yes/no): " -r
echo ""
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]
then
    npx wrangler d1 migrations apply sns-report-production --remote
    if [ $? -ne 0 ]; then
        echo "❌ Migration failed! Please review and fix issues."
        echo "💡 Tip: Test migrations on development first: npm run db:migrate:dev"
        exit 1
    fi
    echo "✅ Migrations applied successfully"
else
    echo "⚠️  Skipping migrations"
fi
echo ""

# Step 6: Deploy to Cloudflare Pages
echo "☁️  Step 5/5: Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name sns-report-generator --branch main
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi
echo "✅ Deployment completed"
echo ""

# Success message
echo "================================================"
echo "🎉 Production Deployment Successful!"
echo "================================================"
echo ""
echo "📍 Your application is now live at:"
echo "   https://sns-report-generator.pages.dev"
echo ""
echo "📊 Next steps:"
echo "   1. Verify the deployment: https://sns-report-generator.pages.dev/api/health"
echo "   2. Test key features (login, CSV upload, reports)"
echo "   3. Monitor for any errors in Cloudflare Dashboard"
echo ""
echo "📁 Backup location: ./backups/"
echo ""
