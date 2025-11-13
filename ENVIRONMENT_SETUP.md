# 環境分離セットアップガイド

このドキュメントでは、開発環境と本番環境を完全に分離し、本番データを保護しながら安全に開発を行う方法を説明します。

## 🎯 実装された機能

### ✅ 完了事項

1. **環境の完全分離**
   - 開発用D1データベース（sns-report-development）
   - 本番用D1データベース（sns-report-production）
   - 環境別の設定ファイル（wrangler.jsonc）

2. **自動バックアップシステム**
   - 本番デプロイ前に自動バックアップ
   - スキーマ、テーブル一覧、メタデータの保存
   - バックアップログの自動生成

3. **安全なデプロイフロー**
   - 開発環境用デプロイスクリプト
   - 本番環境用デプロイスクリプト（確認プロンプト付き）
   - マイグレーション適用の確認

4. **データ保護機能**
   - 既存データ削除防止
   - マイグレーションはスキーマ変更のみ
   - ロールバック手順の文書化

## 📂 プロジェクト構成

```
sns-report-generator/
├── scripts/
│   ├── backup-production.sh       # 本番DBバックアップ
│   ├── deploy-development.sh      # 開発環境デプロイ
│   └── deploy-production.sh       # 本番環境デプロイ
├── backups/                        # バックアップ保存先（.gitignore）
├── migrations/                     # データベースマイグレーション
│   └── 0001_initial_schema.sql
├── wrangler.jsonc                  # 環境別設定
├── .env.example                    # 環境変数テンプレート
├── DEPLOYMENT.md                   # デプロイメントガイド
└── package.json                    # NPMスクリプト
```

## 🗄️ データベース情報

### 開発用データベース

- **名前**: sns-report-development
- **ID**: 013f8309-e293-48b6-b9dc-ddd6dbf9a870
- **リージョン**: ENAM
- **用途**: 
  - 新機能の開発とテスト
  - マイグレーションの検証
  - バグ修正のテスト
- **データ**: テストデータのみ（自由に削除・リセット可能）

### 本番用データベース

- **名前**: sns-report-production
- **ID**: 325c11c2-d5a1-4852-befa-9aaf9bb19d95
- **リージョン**: ENAM
- **用途**: 
  - 本番環境での運用
  - 顧客データの保存
- **データ**: **顧客の実データ（削除厳禁）**

## 🚀 使い方

### 1. ローカル開発

```bash
# 環境変数設定（初回のみ）
cp .env.example .env
# .env ファイルを編集してパスワードを設定

# 依存関係インストール
npm install

# ローカルDBセットアップ
npm run db:migrate:local
npm run db:seed:local

# 開発サーバー起動
npm run build
pm2 start ecosystem.config.cjs
```

### 2. 開発環境へのデプロイ

新機能や修正を開発環境でテストする場合：

```bash
# 自動デプロイスクリプト（推奨）
npm run deploy:dev

# または、手動で実行
npm run build
npm run db:migrate:dev
npx wrangler pages deploy dist --project-name sns-report-generator --branch development
```

**開発環境URL**: https://development.sns-report-generator.pages.dev

### 3. 本番環境へのデプロイ

⚠️ **重要**: 本番デプロイは慎重に行ってください。

```bash
# 自動デプロイスクリプト（推奨）
npm run deploy:prod

# このスクリプトは以下を実行します：
# 1. デプロイ確認プロンプト
# 2. 本番DBの自動バックアップ
# 3. テスト実行（設定されている場合）
# 4. ビルド
# 5. マイグレーション適用の確認
# 6. Cloudflare Pagesへデプロイ
```

**本番環境URL**: https://sns-report-generator.pages.dev

## 🛠️ コマンドリファレンス

### デプロイコマンド

```bash
npm run deploy:dev      # 開発環境にデプロイ
npm run deploy:prod     # 本番環境にデプロイ（確認あり）
npm run backup:prod     # 本番DBバックアップ
```

### データベース管理

```bash
# マイグレーション
npm run db:migrate:local    # ローカルDB
npm run db:migrate:dev      # 開発DB
npm run db:migrate:prod     # 本番DB（慎重に）

# テストデータ投入
npm run db:seed:local       # ローカルDB
npm run db:seed:dev         # 開発DB
npm run db:seed:prod        # 本番DB（通常不要）

# データベースコンソール
npm run db:console:local    # ローカルDB
npm run db:console:dev      # 開発DB
npm run db:console:prod     # 本番DB

# ローカルDBリセット
npm run db:reset:local      # すべてリセット
```

## 📋 マイグレーション作成ガイド

### ✅ 安全なマイグレーション例

新しいテーブルの追加:
```sql
-- migrations/0002_add_analytics.sql

-- 新しいテーブルを作成（既存データに影響なし）
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_client_id ON analytics(client_id);
```

新しい列の追加:
```sql
-- migrations/0003_add_client_status.sql

-- 既存テーブルに列を追加（DEFAULT値付き）
ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE clients ADD COLUMN subscription_tier TEXT DEFAULT 'basic';

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
```

### ❌ 危険な操作（禁止）

```sql
-- ❌ テーブルの削除（既存データが失われる）
DROP TABLE clients;

-- ❌ 列の削除（既存データが失われる）
ALTER TABLE clients DROP COLUMN status;

-- ❌ データの削除
DELETE FROM clients;
TRUNCATE TABLE clients;

-- ❌ NOT NULL制約の追加（既存のNULLデータがある場合）
ALTER TABLE clients ADD COLUMN required_field TEXT NOT NULL;
```

## 🔄 典型的な開発フロー

### シナリオ1: 新機能の追加

```bash
# 1. ローカルで開発
# コードを編集...

# 2. ローカルでテスト
npm run build
pm2 restart sns-report-generator

# 3. 開発環境にデプロイしてテスト
npm run deploy:dev

# 4. 開発環境で動作確認
# https://development.sns-report-generator.pages.dev

# 5. 問題なければ本番デプロイ
npm run deploy:prod
```

### シナリオ2: データベーススキーマの変更

```bash
# 1. マイグレーションファイルを作成
# migrations/000X_description.sql

# 2. ローカルでテスト
npm run db:migrate:local
# SQLiteでテーブル構造を確認
npm run db:console:local
# SQL: .schema table_name

# 3. 開発DBで検証
npm run db:migrate:dev

# 4. 開発環境にデプロイしてテスト
npm run deploy:dev

# 5. 問題なければ本番デプロイ
npm run deploy:prod
# マイグレーション適用の確認プロンプトで "yes" を入力
```

### シナリオ3: 緊急バグ修正

```bash
# 1. バグを修正
# コードを編集...

# 2. ローカルで確認
npm run build
pm2 restart sns-report-generator

# 3. 開発環境でテスト（推奨）
npm run deploy:dev

# 4. 本番デプロイ
npm run deploy:prod
```

## 🔐 データ保護のベストプラクティス

### デプロイ前のチェックリスト

- [ ] 新機能は開発環境でテスト済み
- [ ] マイグレーションがデータを削除しないことを確認
- [ ] ビルドが成功することを確認
- [ ] 本番デプロイスクリプトを使用（自動バックアップ）
- [ ] デプロイ後の動作確認計画を立てた

### マイグレーションのルール

1. **新しいものの追加のみ**
   - 新しいテーブル: ✅
   - 新しい列（DEFAULT値付き）: ✅
   - インデックス: ✅

2. **既存のものの削除は禁止**
   - テーブル削除: ❌
   - 列削除: ❌
   - データ削除: ❌

3. **データ型変更は慎重に**
   - 既存データに影響しない場合のみ: ✅
   - 既存データが失われる可能性: ❌

## 🆘 トラブルシューティング

### マイグレーションが失敗する

```bash
# マイグレーション履歴を確認
npx wrangler d1 migrations list sns-report-production --remote

# SQLを手動で実行してテスト
npx wrangler d1 execute sns-report-production --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 本番データのバックアップを手動で取得

```bash
# バックアップスクリプトを実行
npm run backup:prod

# または、手動でエクスポート
npx wrangler d1 execute sns-report-production --remote \
  --command="SELECT * FROM clients;" > backups/clients_manual.json
```

### デプロイに失敗した場合のロールバック

1. **Cloudflare Dashboard でロールバック**
   - Workers & Pages > sns-report-generator
   - Deployments タブ
   - 前のバージョンの「Rollback to this version」をクリック

2. **データベースのロールバック**
   - バックアップから復元（手動）
   - 逆マイグレーションを作成して実行

## 📊 環境別の設定管理

### wrangler.jsonc の構造

```jsonc
{
  // デフォルト設定（開発環境）
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "sns-report-development",
      "database_id": "013f8309-e293-48b6-b9dc-ddd6dbf9a870"
    }
  ],
  
  // 環境別設定
  "env": {
    "production": {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "sns-report-production",
          "database_id": "325c11c2-d5a1-4852-befa-9aaf9bb19d95"
        }
      ]
    }
  }
}
```

### 環境変数の管理

```bash
# ローカル: .env ファイル
ADMIN_PASSWORD=local123
ENVIRONMENT=local

# 開発環境: Cloudflare Pages Settings
ADMIN_PASSWORD=dev123
ENVIRONMENT=development

# 本番環境: Cloudflare Pages Settings
ADMIN_PASSWORD=<strong-password>
ENVIRONMENT=production
```

## 📞 サポート

問題が発生した場合：
1. [DEPLOYMENT.md](./DEPLOYMENT.md) のトラブルシューティングを確認
2. GitHubのIssuesで報告
3. Cloudflare Dashboardのログを確認

---

**最終更新**: 2025-11-13
**バージョン**: 2.0.0
**ステータス**: ✅ 完全実装済み
