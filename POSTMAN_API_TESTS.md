# Twitter Clone API - Postman Testing Guide

**ベース URL**: `http://localhost:3001`

## ユーザー API (User API)

### 1. ユーザー作成 (Create User)

```
POST /api/users
```

**Body (JSON)**:

```json
{
  "firebase_uid": "test_firebase_uid_001",
  "email": "testuser@example.com",
  "username": "testuser",
  "display_name": "Test User"
}
```

**成功レスポンス (201)**:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "firebase_uid": "test_firebase_uid_001",
      "email": "testuser@example.com",
      "username": "testuser",
      "display_name": "Test User",
      "is_active": true,
      "created_at": "2025-10-20T08:00:00.000Z",
      "updated_at": "2025-10-20T08:00:00.000Z"
    }
  }
}
```

**エラーレスポンス (409 - 重複)**:

```json
{
  "status": "error",
  "message": "Email already in use"
}
```

---

### 2. ユーザー取得（ID 指定）(Get User by ID)

```
GET /api/users/:id
```

**例**:

```
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

**成功レスポンス (200)**:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firebase_uid": "test_firebase_uid_001",
      "email": "testuser@example.com",
      "username": "testuser",
      "display_name": "Test User",
      "is_active": true,
      "created_at": "2025-10-20T08:00:00.000Z",
      "updated_at": "2025-10-20T08:00:00.000Z"
    },
    "profile": {
      "id": "profile-uuid",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "bio": null,
      "location": null,
      "website": null,
      "avatar_url": null,
      "cover_image_url": null,
      "birth_date": null,
      "created_at": "2025-10-20T08:00:00.000Z",
      "updated_at": "2025-10-20T08:00:00.000Z"
    }
  }
}
```

**エラーレスポンス (404)**:

```json
{
  "status": "error",
  "message": "User not found"
}
```

---

### 3. ユーザー取得（ユーザー名指定）(Get User by Username)

```
GET /api/users/username/:username
```

**例**:

```
GET /api/users/username/testuser
```

**成功レスポンス**: ユーザー取得（ID 指定）と同じ

---

### 4. ユーザー一覧取得 (Get All Users)

```
GET /api/users?limit=20&offset=0
```

**クエリパラメータ**:

- `limit`: 取得件数（1-100、デフォルト: 20）
- `offset`: オフセット（デフォルト: 0）

**例**:

```
GET /api/users?limit=10&offset=0
```

**成功レスポンス (200)**:

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid-1",
        "firebase_uid": "firebase_uid_1",
        "email": "user1@example.com",
        "username": "user1",
        "display_name": "User One",
        "is_active": true,
        "created_at": "2025-10-20T08:00:00.000Z",
        "updated_at": "2025-10-20T08:00:00.000Z"
      },
      {
        "id": "uuid-2",
        "firebase_uid": "firebase_uid_2",
        "email": "user2@example.com",
        "username": "user2",
        "display_name": "User Two",
        "is_active": true,
        "created_at": "2025-10-20T08:00:00.000Z",
        "updated_at": "2025-10-20T08:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "count": 2
    }
  }
}
```

---

### 5. ユーザー検索 (Search Users)

```
GET /api/users/search?q=keyword&limit=20
```

**クエリパラメータ**:

- `q`: 検索キーワード（必須）
- `limit`: 取得件数（1-100、デフォルト: 20）

**例**:

```
GET /api/users/search?q=test&limit=10
```

**成功レスポンス (200)**:

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid-1",
        "firebase_uid": "firebase_uid_1",
        "email": "testuser@example.com",
        "username": "testuser",
        "display_name": "Test User",
        "is_active": true,
        "created_at": "2025-10-20T08:00:00.000Z",
        "updated_at": "2025-10-20T08:00:00.000Z"
      }
    ],
    "query": "test",
    "count": 1
  }
}
```

---

### 6. ユーザー更新 (Update User)

```
PUT /api/users/:id
```

**Body (JSON)** - すべてオプション:

```json
{
  "display_name": "Updated Name",
  "is_active": true
}
```

**例**:

```
PUT /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Body**:

```json
{
  "display_name": "New Display Name"
}
```

**成功レスポンス (200)**:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firebase_uid": "test_firebase_uid_001",
      "email": "testuser@example.com",
      "username": "testuser",
      "display_name": "New Display Name",
      "is_active": true,
      "created_at": "2025-10-20T08:00:00.000Z",
      "updated_at": "2025-10-20T08:10:00.000Z"
    }
  }
}
```

---

### 7. ユーザー削除（ソフトデリート）(Delete User)

```
DELETE /api/users/:id
```

**例**:

```
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
```

**成功レスポンス (200)**:

```json
{
  "status": "success",
  "message": "User deleted successfully"
}
```

**注意**: ソフトデリートなので、ユーザーは `is_active = false` になりますが、データベースからは削除されません。

---

### 8. ユーザー削除（完全削除）(Hard Delete User)

```
DELETE /api/users/:id/permanent
```

**例**:

```
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000/permanent
```

**成功レスポンス (200)**:

```json
{
  "status": "success",
  "message": "User permanently deleted"
}
```

**注意**: ユーザーとそれに関連するすべてのデータ（プロフィール、投稿、いいね、フォローなど）が完全に削除されます。

---

## エラーレスポンス

### バリデーションエラー (400)

```json
{
  "status": "error",
  "message": "Invalid email format"
}
```

### 認証エラー (401)

```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### リソースが見つからない (404)

```json
{
  "status": "error",
  "message": "User not found"
}
```

### 競合エラー (409)

```json
{
  "status": "error",
  "message": "Email already in use"
}
```

### サーバーエラー (500)

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Postman テスト手順

### 1. 新しいユーザーを作成

```
POST http://localhost:3001/api/users
```

Body:

```json
{
  "firebase_uid": "my_test_user_001",
  "email": "mytest@example.com",
  "username": "mytestuser",
  "display_name": "My Test User"
}
```

### 2. レスポンスからユーザー ID をコピー

レスポンスの `data.user.id` をコピー

### 3. その ID でユーザーを取得

```
GET http://localhost:3001/api/users/{コピーしたID}
```

### 4. ユーザーを更新

```
PUT http://localhost:3001/api/users/{コピーしたID}
```

Body:

```json
{
  "display_name": "Updated Test User"
}
```

### 5. ユーザーを検索

```
GET http://localhost:3001/api/users/search?q=mytest
```

### 6. ユーザー一覧を取得

```
GET http://localhost:3001/api/users?limit=20&offset=0
```

---

## 次のステップ

ユーザー API のテストが完了したら、次は以下の API を実装します：

1. **プロフィール API** - プロフィール情報の更新
2. **投稿 API** - 投稿の CRUD 操作
3. **いいね API** - いいね/いいね解除
4. **フォロー API** - フォロー/フォロー解除
5. **タイムライン API** - フォローユーザーの投稿取得

---

## トラブルシューティング

### サーバーが起動していない場合

```bash
docker-compose up -d
```

### ログ確認

```bash
docker-compose logs -f backend
```

### データベースリセット

```bash
docker-compose down -v
docker-compose up -d
cd backend && npm run migrate
```
