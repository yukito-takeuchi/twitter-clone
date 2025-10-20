# Twitter Clone Application

Express のキャッチアップとインターンで使用したツールの実践活用を目的とした、Twitter クローンアプリケーション。

## 技術スタック

### フロントエンド
- TypeScript
- Next.js
- MUI (Material-UI)
- Tailwind CSS

### バックエンド
- Node.js
- Express
- TypeScript
- PostgreSQL

### インフラ・ツール
- Docker
- Vercel (フロントエンド)
- Heroku (バックエンド)
- Google Cloud Storage (画像保存)
- Firebase Authentication (認証)
- Datadog (監視)
- Mailgun (メール送信)

## セットアップ

### 必要条件
- Docker & Docker Compose
- Node.js 20 以上
- pnpm (推奨) または npm

### バックエンド起動手順

1. **Docker環境の起動**
   ```bash
   # プロジェクトルートディレクトリで実行
   docker-compose up -d
   ```

   これにより以下のサービスが起動します：
   - PostgreSQL（ポート: 5432）
   - バックエンド API（ポート: 3001）

2. **サーバーの動作確認**
   ```bash
   # サーバーのヘルスチェック
   curl http://localhost:3001/health

   # データベース接続確認
   curl http://localhost:3001/health/db
   ```

3. **ログの確認**
   ```bash
   # バックエンドのログ表示
   cd backend && npm run docker:logs

   # データベースのログ表示
   cd backend && npm run docker:db:logs
   ```

### Dockerコマンド一覧

```bash
cd backend

# コンテナの起動
npm run docker:up

# コンテナの停止
npm run docker:down

# バックエンドコンテナの再起動
npm run docker:restart

# コンテナの再ビルド
npm run docker:rebuild

# バックエンドログの表示
npm run docker:logs

# データベースログの表示
npm run docker:db:logs
```

### ローカル開発（Docker不使用）

Docker を使わずにローカルで開発する場合：

1. PostgreSQL を手動でインストール・起動
2. `backend/.env` の `DATABASE_URL` をローカルホストに変更
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/twitter_clone
   ```
3. バックエンドの起動
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## プロジェクト構造

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # 設定ファイル
│   │   │   ├── index.ts     # 環境変数管理
│   │   │   └── database.ts  # DB接続設定
│   │   ├── controllers/     # コントローラー
│   │   ├── models/          # データモデル
│   │   ├── routes/          # ルーティング
│   │   ├── services/        # ビジネスロジック
│   │   ├── middlewares/     # ミドルウェア
│   │   ├── utils/           # ユーティリティ
│   │   └── index.ts         # エントリーポイント
│   ├── init.sql             # DB初期化スクリプト
│   ├── Dockerfile           # Dockerイメージ定義
│   ├── .env                 # 環境変数
│   └── package.json
├── frontend/
│   └── (Next.js プロジェクト)
├── docker-compose.yml       # Docker Compose設定
└── README.md
```

## API エンドポイント

### ヘルスチェック
- `GET /health` - サーバーの稼働確認
- `GET /health/db` - データベース接続確認

## 開発フェーズ

### Phase 1（MVP） - 現在実装中
- [x] Docker環境セットアップ
- [ ] 認証機能（Firebase Authentication）
- [ ] 投稿機能（CRUD）
- [ ] プロフィール機能（CRUD）
- [ ] いいね機能
- [ ] フォロー機能
- [ ] 画像アップロード（Google Cloud Storage）
- [ ] タイムライン表示

### Phase 2（拡張機能）
- [ ] DM（ダイレクトメッセージ）機能
- [ ] 通知機能
- [ ] 検索機能
- [ ] リツイート機能
- [ ] 保存機能
- [ ] View カウント

## トラブルシューティング

### ポート競合エラー
```bash
# ポート 5432 が使用中の場合
lsof -ti:5432 | xargs kill -9

# ポート 3001 が使用中の場合
lsof -ti:3001 | xargs kill -9
```

### データベース接続エラー
```bash
# データベースコンテナの状態確認
docker ps

# データベースのログ確認
docker-compose logs postgres
```

### コンテナの完全リセット
```bash
# すべてのコンテナとボリュームを削除
docker-compose down -v

# 再度起動
docker-compose up -d --build
```

## 次のステップ

1. データベーススキーマの設計と実装
2. Firebase Authentication の設定
3. ユーザー認証エンドポイントの実装
4. 投稿機能の実装

## ライセンス

このプロジェクトは学習目的で作成されています。
