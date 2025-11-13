# デプロイメントガイド

このドキュメントでは、開発環境と本番環境を安全に運用するためのデプロイメントフローを説明します。

## 🏗️ 環境構成

### 環境一覧

| 環境 | 用途 | データベース | URL |
|------|------|--------------|-----|
| **Local** | ローカル開発 | SQLite (ローカル) | http://localhost:3000 |
| **Development** | リモート開発・テスト | sns-report-development | https://development.sns-report-generator.pages.dev |
| **Production** | 本番環境 | sns-report-production | https://sns-report-generator.pages.dev |

### データベース情報

**開発用データベース:**
- 名前: `sns-report-development`
- ID: `013f8309-e293-48b6-b9dc-ddd6dbf9a870`
- 用途: 新機能のテスト、マイグレーションの検証

**本番用データベース:**
- 名前: `sns-report-production`
- ID: `325c11c2-d5a1-4852-befa-9aaf9bb19d95`
- 用途: 顧客データの保存、本番運用
- ⚠️ **重要**: 既存データは絶対に削除しない

## 🔄 開発フロー

### 1. ローカル開発

```bash
# 依存関係インストール
npm install

# ローカルDBマイグレーション
npm run db:migrate:local

# テストデータ投入
npm run db:seed:local

# ビルド
npm run build

# 開発サーバー起動（PM2）
pm2 start ecosystem.config.cjs

# または、Vite開発サーバー
npm run dev
```

### 2. 開発環境へのデプロイ

新機能や修正を開発環境でテストします。

```bash
# 開発環境にデプロイ（自動化スクリプト）
npm run deploy:dev

# または、手動でステップ実行
npm run build
npm run db:migrate:dev
npx wrangler pages deploy dist --project-name sns-report-generator --branch development
```

**開発環境URL**: https://development.sns-report-generator.pages.dev

### 3. 本番環境へのデプロイ

⚠️ **必須手順**: 本番デプロイ前に必ずバックアップを取得してください。

```bash
# 本番環境にデプロイ（推奨：自動化スクリプト）
npm run deploy:prod

# このスクリプトは以下を自動実行します：
# 1. 確認プロンプト
# 2. 本番DBバックアップ
# 3. テスト実行（設定されている場合）
# 4. ビルド
# 5. マイグレーション適用の確認
# 6. Cloudflare Pagesへデプロイ
```

**本番環境URL**: https://sns-report-generator.pages.dev

## 🗄️ データベース管理

### マイグレーション

#### 新しいマイグレーションの作成

```bash
# migrations/ ディレクトリに新しいSQLファイルを作成
# ファイル名: 000X_description.sql
# 例: 0002_add_user_roles.sql

# マイグレーションファイル例:
```sql
-- migrations/0002_add_user_roles.sql

-- 新しい列を追加（既存データは保持）
ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active';

-- 新しいテーブルを作成
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_user_roles_client_id ON user_roles(client_id);
```
```

#### マイグレーションの適用

```bash
# ローカル環境
npm run db:migrate:local

# 開発環境（テスト）
npm run db:migrate:dev

# 本番環境（慎重に！）
npm run db:migrate:prod
```

### バックアップ

#### 本番データベースのバックアップ

```bash
# 手動バックアップ
npm run backup:prod

# バックアップファイルは ./backups/ に保存されます
# - db_info_YYYYMMDD_HHMMSS.txt: データベース情報
# - tables_YYYYMMDD_HHMMSS.txt: テーブル一覧
# - schema_YYYYMMDD_HHMMSS.sql: スキーマ定義
# - backup_log_YYYYMMDD_HHMMSS.txt: バックアップログ
```

#### データのエクスポート（テーブル単位）

```bash
# 特定のテーブルをエクスポート
npx wrangler d1 execute sns-report-production --remote \
  --command="SELECT * FROM clients;" > backups/clients_export.json

# 全テーブルをエクスポート（手動）
npx wrangler d1 execute sns-report-production --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';" | \
  grep -v "sqlite_" | \
  while read table; do
    npx wrangler d1 execute sns-report-production --remote \
      --command="SELECT * FROM $table;" > "backups/${table}_export.json"
  done
```

### データのリストア（緊急時）

⚠️ **注意**: リストアは既存データを上書きする可能性があります。

```bash
# スキーマのリストア
npx wrangler d1 execute sns-report-production --remote \
  --file=backups/schema_YYYYMMDD_HHMMSS.sql

# データの挿入（INSERT文が含まれるSQLファイル）
npx wrangler d1 execute sns-report-production --remote \
  --file=backups/data_restore.sql
```

## 🔒 データ保護のベストプラクティス

### マイグレーションのルール

✅ **許可される操作:**
- 新しいテーブルの作成
- 新しい列の追加（DEFAULT値付き）
- インデックスの追加
- 新しい制約の追加（既存データに影響しない場合）

❌ **禁止される操作:**
- テーブルの削除（DROP TABLE）
- 列の削除（DROP COLUMN）
- データ型の変更（既存データに影響する場合）
- NOT NULL制約の追加（既存データがNULLの場合）

### デプロイ前のチェックリスト

- [ ] マイグレーションを開発環境でテスト済み
- [ ] 本番データベースのバックアップを取得
- [ ] マイグレーションがデータを削除しないことを確認
- [ ] ビルドが成功することを確認
- [ ] デプロイ後の動作確認計画を立てた

### ロールバック手順

デプロイ後に問題が発生した場合：

1. **即座にロールバック:**
   ```bash
   # 前のデプロイメントに戻す（Cloudflare Dashboard）
   # Workers & Pages > sns-report-generator > Deployments
   # 前のバージョンの「Rollback to this version」をクリック
   ```

2. **データベースのロールバック:**
   ```bash
   # マイグレーションを手動で戻す必要がある場合
   # 逆マイグレーションSQLを実行
   npx wrangler d1 execute sns-report-production --remote \
     --file=migrations/rollback_000X.sql
   ```

## 🚀 デプロイコマンド一覧

### 開発環境

```bash
npm run deploy:dev          # 開発環境にデプロイ
npm run db:migrate:dev      # 開発DBマイグレーション
npm run db:seed:dev         # 開発DBにテストデータ投入
npm run db:console:dev      # 開発DBコンソール
```

### 本番環境

```bash
npm run deploy:prod         # 本番環境にデプロイ（推奨）
npm run backup:prod         # 本番DBバックアップ
npm run db:migrate:prod     # 本番DBマイグレーション（慎重に）
npm run db:console:prod     # 本番DBコンソール
```

### ローカル環境

```bash
npm run dev                 # Vite開発サーバー
npm run dev:sandbox         # Wrangler開発サーバー
npm run db:migrate:local    # ローカルDBマイグレーション
npm run db:seed:local       # ローカルDBにテストデータ投入
npm run db:reset:local      # ローカルDBリセット
```

## 📊 環境変数の管理

### ローカル環境

`.env` ファイル（Gitにコミットしない）:
```env
ADMIN_PASSWORD=local123
ENVIRONMENT=local
```

### 開発環境

Cloudflare Dashboardまたはwranglerで設定:
```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name sns-report-generator
# 入力: dev123
```

### 本番環境

Cloudflare Dashboard > Settings > Environment variables > Production:
```
ADMIN_PASSWORD=<strong-password>
ENVIRONMENT=production
```

## 🔍 トラブルシューティング

### マイグレーションが失敗する

```bash
# マイグレーション履歴を確認
npx wrangler d1 migrations list sns-report-production --remote

# 手動でSQLを実行してテスト
npx wrangler d1 execute sns-report-production --remote \
  --command="SELECT * FROM sqlite_master WHERE type='table';"
```

### デプロイが失敗する

```bash
# ビルドエラーを確認
npm run build

# wranglerの詳細ログを確認
npx wrangler pages deploy dist --project-name sns-report-generator --verbose
```

### データベース接続エラー

1. Cloudflare Dashboard > Workers & Pages > sns-report-generator
2. Settings > Functions
3. D1 database bindings が正しく設定されているか確認
   - Variable name: `DB`
   - D1 database: `sns-report-production` (本番) または `sns-report-development` (開発)

## 📞 サポート

問題が発生した場合：
1. このドキュメントのトラブルシューティングセクションを確認
2. GitHubのIssuesで報告
3. Cloudflare Dashboardのログを確認

---

**最終更新**: 2025-11-13
**バージョン**: 2.0.0
