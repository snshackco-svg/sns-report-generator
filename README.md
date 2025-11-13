# SNSレポート生成システム

クライアントごとのSNS CSV（主にMetricool等）をアップロードし、データを自動整形・集計してクライアント提出用レポートや社内向け週報を自動生成するフルスタックWebアプリケーションです。

## 🌐 アクセスURL

- **開発環境**: https://3000-i64kqcilnxyxv9s1t23tz-cc2fbc16.sandbox.novita.ai
- **GitHub**: https://github.com/snshackco-svg/sns-report-generator

## 🎯 プロジェクト概要

### 主要機能

1. **シンプル認証**: パスワードのみでログイン（環境変数 `ADMIN_PASSWORD` と一致で入室）
2. **マルチクライアント管理**: クライアントごとにCSVデータを蓄積・集計
3. **柔軟なCSV取り込み**: 列マッピングUIで様々なCSVフォーマットに対応
4. **KPI管理**: 月次・週次KPIの設定と達成率可視化
5. **自動レポート生成**: クライアント提出用月次レポート・社内向け週報をワンクリック生成
6. **データ可視化**: グラフとチャートでデータトレンドを表示

### 完了済み機能 ✅

- [x] パスワード認証システム
- [x] クライアント管理（作成・編集・削除）
- [x] CSVアップロード機能
- [x] 柔軟な列マッピングシステム
- [x] データ正規化・クレンジング
- [x] 日付パース（複数フォーマット対応、Asia/Tokyoタイムゾーン）
- [x] ISO週番号計算（月曜始まり）
- [x] 統計API（月次・週次・期間指定・トレンド）
- [x] トップ投稿ランキング（任意指標でソート可能）
- [x] KPI設定・管理API
- [x] KPI進捗計算（達成率・先週比）
- [x] カスタムKPI（数式ビルダー対応）
- [x] レポート自動生成（月次クライアント向け・週次社内向け）
- [x] Markdown/HTML出力
- [x] アップロード履歴管理
- [x] データ品質ログ（欠損・除外理由記録）

### 未実装機能 ⏳

- [ ] ダッシュボードのグラフ表示（Chart.js統合）
- [ ] PDF出力機能
- [ ] レポート編集機能
- [ ] 画像・グラフのレポート埋め込み
- [ ] AI要約機能（LLM統合）
- [ ] 競合分析機能
- [ ] A/Bテスト追跡機能
- [ ] カスタムアラート設定

## 📊 データアーキテクチャ

### 使用技術

- **フロントエンド**: Vanilla JS + TailwindCSS + Chart.js + Axios
- **バックエンド**: Hono (TypeScript)
- **データベース**: Cloudflare D1 (SQLite)
- **デプロイ**: Cloudflare Pages/Workers
- **開発環境**: Vite + Wrangler

### データモデル

#### 主要テーブル

1. **clients**: クライアント情報
2. **uploads**: CSVアップロード履歴
3. **sns_data**: 正規化されたSNSデータ（日次）
4. **kpi_settings**: KPI設定（月次・週次・カスタム）
5. **reports**: 生成されたレポート
6. **data_logs**: データ品質ログ
7. **column_mappings**: 列マッピングテンプレート

#### 正規化後のデータスキーマ

```json
{
  "date": "YYYY-MM-DD",
  "title": "投稿タイトル",
  "link": "https://...",
  "views": 1000,
  "likes": 50,
  "comments": 10,
  "shares": 5,
  "saves": 20,
  "reach": 800,
  "impressions": 1200,
  "engagement": 85,
  "engagement_rate": 0.10625,
  "week_iso": "2025-W46"
}
```

### データフロー

1. **CSV取り込み**: 
   - ユーザーがCSVをアップロード
   - 列マッピングUIで標準フィールドに対応付け
   - データクレンジング（日付正規化、数値変換、欠損処理）
   - ISO週番号計算（月曜始まり）
   - D1データベースに保存

2. **統計計算**:
   - 日次・週次・月次での集計
   - KPI進捗計算（目標 vs 実績）
   - 先週比・先月比の算出
   - エンゲージメント率などの派生指標計算

3. **レポート生成**:
   - テンプレートベースのMarkdown生成
   - KPI進捗、ハイライト、課題、改善提案を自動抽出
   - トップ投稿ランキング
   - 週次推移グラフデータ

## 🚀 セットアップ

### 前提条件

- Node.js 18+
- npm または yarn
- Cloudflare アカウント（本番デプロイ時）

### ローカル開発

```bash
# 依存関係のインストール
npm install

# データベースマイグレーション（ローカル）
npm run db:migrate:local

# シードデータ投入
npm run db:seed

# ビルド
npm run build

# 開発サーバー起動（PM2使用）
npm run clean-port
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs --nostream
```

### デフォルト設定

- **ログインパスワード**: `demo123` （環境変数 `ADMIN_PASSWORD` で変更可能）
- **ポート**: 3000
- **タイムゾーン**: Asia/Tokyo
- **週始まり**: 月曜日

## 📖 使い方

### 1. ログイン

- パスワード入力画面でパスワードを入力（デフォルト: `demo123`）

### 2. クライアント作成

- 「新規クライアント」ボタンをクリック
- クライアント名、業種、メモを入力

### 3. CSVアップロード

- クライアントカードから「CSV取込」をクリック
- CSVファイルをドラッグ&ドロップまたは選択
- 列マッピング画面で、CSVの列と標準フィールドを対応付け
- 「データを取り込む」で処理実行

### 4. ダッシュボード確認

- 「ダッシュボード」で統計情報やグラフを表示（実装中）

### 5. レポート生成

- 「レポート」から「月次レポート生成」をクリック
- 自動生成されたレポートをプレビュー
- Markdown/HTML形式でダウンロード可能

## 🔧 API エンドポイント

### 認証

- `POST /api/auth/login` - パスワード認証

### クライアント管理

- `GET /api/clients` - クライアント一覧取得
- `GET /api/clients/:id` - クライアント詳細
- `POST /api/clients` - クライアント作成
- `PUT /api/clients/:id` - クライアント更新
- `DELETE /api/clients/:id` - クライアント削除

### CSVアップロード

- `POST /api/uploads/:clientId` - CSV処理・取り込み
- `GET /api/uploads/:clientId/history` - アップロード履歴
- `GET /api/uploads/:clientId/mappings` - マッピングテンプレート一覧
- `POST /api/uploads/:clientId/mappings` - マッピングテンプレート保存

### 統計・分析

- `GET /api/stats/:clientId/monthly` - 月次統計
- `GET /api/stats/:clientId/weekly` - 週次統計
- `GET /api/stats/:clientId/range` - 期間指定統計
- `GET /api/stats/:clientId/daily-trend` - 日次トレンド
- `GET /api/stats/:clientId/weekly-trend` - 週次トレンド
- `GET /api/stats/:clientId/top-posts` - トップ投稿
- `GET /api/stats/:clientId/comparison` - 期間比較

### KPI管理

- `GET /api/kpi/:clientId` - KPI設定取得
- `POST /api/kpi/:clientId` - KPI設定作成・更新
- `POST /api/kpi/:clientId/batch` - KPI一括設定
- `DELETE /api/kpi/:clientId/:kpiId` - KPI削除
- `GET /api/kpi/:clientId/progress` - KPI進捗計算

### レポート

- `GET /api/reports/:clientId` - レポート一覧
- `GET /api/reports/:clientId/:reportId` - レポート詳細
- `POST /api/reports/:clientId/generate` - レポート生成
- `DELETE /api/reports/:clientId/:reportId` - レポート削除

## 📝 CSV フォーマット要件

### 必須列

- **日付列**: 日付情報（YYYY-MM-DD、MM/DD/YYYY、YYYY/MM/DD などに対応）

### 対応可能な列

- 投稿タイトル
- リンク
- 再生数 (Views)
- いいね (Likes)
- コメント (Comments)
- シェア (Shares)
- 保存 (Saves)
- リーチ (Reach)
- インプレッション (Impressions)
- 視聴時間（秒）
- 平均視聴時間（秒）
- 視聴完了率 (VCR)
- プロフィール訪問
- フォロー
- 外部リンククリック

### データクレンジング

- 空行・重複行は自動削除
- 日付パースに失敗した行は除外してログに記録
- 数値列は非数値を0に変換
- 存在しない列はスキップ

## 🔐 セキュリティ

- パスワード認証（シンプルだが本番環境では改善推奨）
- クライアント単位のデータ分離
- SQLインジェクション対策（Prepared Statements使用）
- CORS設定

## 🚢 デプロイ（Cloudflare Pages）

### 準備

1. Cloudflare アカウント作成
2. Wrangler CLI でログイン: `npx wrangler login`
3. D1データベース作成: `npx wrangler d1 create sns-report-production`
4. `wrangler.jsonc` の `database_id` を更新

### デプロイ手順

```bash
# ビルド
npm run build

# マイグレーション（本番）
npm run db:migrate:prod

# シードデータ投入（必要に応じて）
npx wrangler d1 execute sns-report-production --file=./seed.sql

# デプロイ
npm run deploy
```

### 環境変数設定

```bash
# パスワード設定
npx wrangler pages secret put ADMIN_PASSWORD --project-name sns-report-generator
```

## 📂 プロジェクト構造

```
sns-report-generator/
├── src/
│   ├── index.tsx              # メインアプリケーション
│   ├── types.ts               # TypeScript型定義
│   └── routes/
│       ├── auth.ts            # 認証ルート
│       ├── clients.ts         # クライアント管理
│       ├── uploads.ts         # CSV処理
│       ├── stats.ts           # 統計・分析
│       ├── kpi.ts             # KPI管理
│       └── reports.ts         # レポート生成
├── public/
│   └── static/
│       └── app.js             # フロントエンドSPA
├── migrations/
│   └── 0001_initial_schema.sql
├── seed.sql                   # サンプルデータ
├── wrangler.jsonc             # Cloudflare設定
├── vite.config.ts             # Viteビルド設定
├── ecosystem.config.cjs       # PM2設定
└── package.json
```

## 🎨 スタイル・UI

- TailwindCSS（CDN版使用）
- Font Awesome アイコン
- レスポンシブデザイン
- モダンなカード型UI

## 📈 今後の推奨改善点

### 優先度: 高

1. **グラフ表示機能の完全実装**
   - Chart.js統合
   - 折れ線グラフ（日次・週次トレンド）
   - 棒グラフ（週別比較）
   - 円グラフ（投稿タイプ分布）

2. **PDF出力機能**
   - Puppeteer または jsPDF 統合
   - レポートの高品質PDF化

3. **レポート編集機能**
   - 生成後のMarkdown編集
   - カスタムコメント追加

### 優先度: 中

4. **AI要約機能**
   - OpenAI/Claude API統合
   - データに基づく自動インサイト生成
   - ハイライト・課題・提案の自動抽出精度向上

5. **高度なKPI機能**
   - KPIテンプレート
   - アラート設定（目標未達時）
   - 予測分析

6. **ユーザー管理**
   - 複数ユーザー対応
   - 権限管理（閲覧のみ・編集可能）

### 優先度: 低

7. **データエクスポート**
   - Excel形式エクスポート
   - Googleスプレッドシート連携

8. **API連携**
   - Metricool API直接連携
   - Instagram Graph API
   - Twitter API

9. **通知機能**
   - メール通知
   - Slack通知
   - 週次レポート自動送信

## 🐛 既知の問題

- KPI計算でeval()を使用（セキュリティ改善必要）
- PDF出力機能未実装
- グラフ表示が未完成
- レポート編集機能がない

## 📄 ライセンス

MIT License

## 👥 作成者

SNS Report Generator Team

## 📞 サポート

問題や要望があれば、GitHubのIssuesで報告してください。

---

**最終更新**: 2025-11-13
**バージョン**: 1.0.0 (Beta)
**ステータス**: ✅ 開発中・テスト可能
