# Heroku デプロイ手順

## 前提条件

- Heroku CLI がインストールされていること
- Git がインストールされていること
- Heroku アカウントを持っていること

## 初回デプロイ

### 1. Heroku CLI にログイン

```bash
heroku login
```

### 2. Heroku アプリを作成

```bash
# アプリ名は任意（省略すると自動生成）
heroku create your-backend-app-name
```

### 3. Heroku Postgres アドオンを追加

```bash
# Essential プラン（無料枠）
heroku addons:create heroku-postgresql:essential-0

# または Mini プラン（有料・$5/月）
# heroku addons:create heroku-postgresql:mini
```

### 4. コンテナスタックを設定

```bash
heroku stack:set container
```

### 5. 環境変数を設定

```bash
# DATABASE_URL は Postgres アドオンで自動設定されます

# その他の環境変数を設定
heroku config:set NODE_ENV=production

# Firebase Admin SDK の設定（必要に応じて）
# heroku config:set FIREBASE_PROJECT_ID=your-project-id
# heroku config:set FIREBASE_CLIENT_EMAIL=your-client-email
# heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"

# CORS設定（フロントエンドのURL）
# heroku config:set CORS_ORIGIN=https://your-frontend-app.vercel.app
```

### 6. デプロイ

```bash
# backend ディレクトリから実行
git add .
git commit -m "Configure for Heroku deployment"
git push heroku main

# もしくは別のブランチからデプロイする場合
# git push heroku your-branch:main
```

### 7. データベースマイグレーション

```bash
# マイグレーションを実行（必要に応じて）
heroku run npm run migrate
```

### 8. ログを確認

```bash
# リアルタイムでログを表示
heroku logs --tail

# 過去のログを表示
heroku logs --num 200
```

### 9. アプリを開く

```bash
heroku open
```

## 更新デプロイ

コードを変更した後:

```bash
git add .
git commit -m "Update message"
git push heroku main
```

## 便利なコマンド

### アプリ情報を確認

```bash
heroku apps:info
```

### 環境変数を確認

```bash
heroku config
```

### 環境変数を設定

```bash
heroku config:set KEY=VALUE
```

### 環境変数を削除

```bash
heroku config:unset KEY
```

### データベースに接続

```bash
heroku pg:psql
```

### データベース情報を確認

```bash
heroku pg:info
```

### アプリを再起動

```bash
heroku restart
```

### リリース履歴を確認

```bash
heroku releases
```

### ロールバック

```bash
heroku rollback
```

## トラブルシューティング

### ビルドエラーが発生した場合

```bash
# ログを確認
heroku logs --tail

# ビルドログを確認
heroku builds:info
```

### データベース接続エラーが発生した場合

```bash
# DATABASE_URL が設定されているか確認
heroku config:get DATABASE_URL

# データベースの状態を確認
heroku pg:info

# データベースをリセット（注意: すべてのデータが削除されます）
heroku pg:reset DATABASE_URL
heroku run npm run migrate
```

### メモリ不足エラーが発生した場合

```bash
# dyno のサイズを確認
heroku ps

# より大きな dyno にアップグレード（有料）
# heroku ps:resize web=standard-1x
```

## 重要な注意事項

1. **環境変数**: `.env` ファイルは Git にコミットしないでください。すべての環境変数は `heroku config:set` で設定します。

2. **DATABASE_URL**: Heroku Postgres アドオンを追加すると、`DATABASE_URL` が自動的に設定されます。手動で設定する必要はありません。

3. **PORT**: Heroku は動的にポートを割り当てます。`process.env.PORT` を使用してください。

4. **ファイルストレージ**: Heroku のファイルシステムは一時的です。画像などのアップロードファイルは S3 や Cloudinary などの外部ストレージを使用してください。

5. **無料プラン**: Heroku の無料プランは 2022年11月に廃止されました。最低でも Eco dyno（$5/月）が必要です。

## Heroku Postgres プラン

- **Essential 0**: $0/月（開発・テスト用、本番環境には非推奨）
- **Essential 1**: $5/月（小規模な本番環境）
- **Mini**: $5/月（標準の本番環境）
- **Basic**: $9/月
- **Standard 0**: $50/月

詳細: https://www.heroku.com/postgres-pricing

## 参考リンク

- [Heroku Container Registry & Runtime](https://devcenter.heroku.com/articles/container-registry-and-runtime)
- [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
