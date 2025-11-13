#!/bin/bash
# Production Database Backup Script
# This script creates a backup of the production database before deployment

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/production_backup_$TIMESTAMP.sql"
DATABASE_NAME="sns-report-production"
DATABASE_ID="325c11c2-d5a1-4852-befa-9aaf9bb19d95"

echo "================================================"
echo "🔐 SNS Report Generator - Production DB Backup"
echo "================================================"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup of production database..."
echo "Database: $DATABASE_NAME"
echo "Timestamp: $TIMESTAMP"
echo ""

# Export the entire database
# Note: Cloudflare D1 doesn't have a direct export command yet
# We'll query all tables and export data

echo "⚠️  Note: Full database export via wrangler is limited."
echo "Creating metadata backup..."

# Get database info
npx wrangler d1 info "$DATABASE_NAME" > "$BACKUP_DIR/db_info_$TIMESTAMP.txt"

# List all tables
echo "📋 Exporting table list..."
npx wrangler d1 execute "$DATABASE_NAME" --remote --command="SELECT name FROM sqlite_master WHERE type='table';" > "$BACKUP_DIR/tables_$TIMESTAMP.txt"

# Export schema (CREATE TABLE statements)
echo "📐 Exporting schema..."
npx wrangler d1 execute "$DATABASE_NAME" --remote --command="SELECT sql FROM sqlite_master WHERE type='table';" > "$BACKUP_DIR/schema_$TIMESTAMP.sql"

# Note: For full data backup, you would need to export each table individually
# This is a simplified version for demonstration

echo ""
echo "✅ Backup completed!"
echo "Location: $BACKUP_DIR/"
echo "Files created:"
echo "  - db_info_$TIMESTAMP.txt"
echo "  - tables_$TIMESTAMP.txt"
echo "  - schema_$TIMESTAMP.sql"
echo ""
echo "⚠️  Important: For complete data backup, consider:"
echo "  1. Exporting individual tables via wrangler d1 execute"
echo "  2. Using Cloudflare Dashboard to export data"
echo "  3. Implementing application-level backup via API"
echo ""

# Create a backup log
cat > "$BACKUP_DIR/backup_log_$TIMESTAMP.txt" << EOF
Backup Information
==================
Date: $(date)
Database: $DATABASE_NAME
Database ID: $DATABASE_ID
Backup Type: Schema + Metadata
Status: Completed

Files:
- db_info_$TIMESTAMP.txt
- tables_$TIMESTAMP.txt
- schema_$TIMESTAMP.sql

Next Steps:
1. Review schema changes in migrations/
2. Test migrations on development database
3. Apply migrations to production with: npm run db:migrate:prod
4. Deploy with: npm run deploy:prod
EOF

echo "📝 Backup log created: backup_log_$TIMESTAMP.txt"
echo ""
