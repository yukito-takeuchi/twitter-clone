# Twitter Clone API - 全エンドポイント一覧

**ベースURL**: `http://localhost:3001`

---

## ユーザーAPI

### 1. ユーザー作成
```
POST /api/users
```
**Body**:
```json
{
  "firebase_uid": "test_001",
  "email": "test@example.com",
  "username": "testuser",
  "display_name": "Test User"
}
```

### 2. ユーザー取得（ID）
```
GET /api/users/:id
```

### 3. ユーザー取得（ユーザー名）
```
GET /api/users/username/:username
```

### 4. ユーザー一覧
```
GET /api/users?limit=20&offset=0
```

### 5. ユーザー検索
```
GET /api/users/search?q=keyword&limit=20
```

### 6. ユーザー更新
```
PUT /api/users/:id
```
**Body**:
```json
{
  "display_name": "Updated Name"
}
```

### 7. ユーザー削除
```
DELETE /api/users/:id
```

---

## プロフィールAPI

### 1. プロフィール取得
```
GET /api/profiles/:userId
```

### 2. プロフィール更新
```
PUT /api/profiles/:userId
```
**Body**:
```json
{
  "bio": "Hello! I'm a developer",
  "location": "Tokyo, Japan",
  "website": "https://example.com",
  "avatar_url": "https://example.com/avatar.jpg",
  "cover_image_url": "https://example.com/cover.jpg"
}
```

### 3. プロフィール削除
```
DELETE /api/profiles/:userId
```

---

## 投稿API

### 1. 投稿作成
```
POST /api/posts
```
**Body**:
```json
{
  "user_id": "user-uuid-here",
  "content": "Hello, Twitter!",
  "image_url": "https://example.com/image.jpg"
}
```

**リプライの場合**:
```json
{
  "user_id": "user-uuid-here",
  "content": "This is a reply",
  "reply_to_id": "post-uuid-here"
}
```

### 2. 投稿取得（ID）
```
GET /api/posts/:id
```

### 3. 投稿一覧
```
GET /api/posts?limit=20&offset=0
```

### 4. ユーザーの投稿一覧
```
GET /api/posts/user/:userId?limit=20&offset=0
```

### 5. タイムライン取得
```
GET /api/posts/timeline/:userId?limit=20&offset=0
```

### 6. リプライ取得
```
GET /api/posts/:id/replies?limit=20&offset=0
```

### 7. 投稿検索
```
GET /api/posts/search?q=keyword&limit=20&offset=0
```

### 8. 投稿更新
```
PUT /api/posts/:id
```
**Body**:
```json
{
  "content": "Updated content"
}
```

### 9. 投稿削除
```
DELETE /api/posts/:id
```

### 10. 投稿をピン留め
```
POST /api/posts/:postId/pin
```
**Body**:
```json
{
  "user_id": "user-uuid-here"
}
```

### 11. 投稿のピン留め解除
```
DELETE /api/posts/:userId/:postId/pin
```

### 12. ユーザーのピン留め投稿取得
```
GET /api/users/:userId/pinned-post?current_user_id=current-user-uuid
```

---

## いいねAPI

### 1. いいね
```
POST /api/likes
```
**Body**:
```json
{
  "user_id": "user-uuid-here",
  "post_id": "post-uuid-here"
}
```

### 2. いいね解除
```
DELETE /api/likes/:userId/:postId
```

### 3. 投稿にいいねしたユーザー一覧
```
GET /api/likes/post/:postId?limit=20&offset=0
```

### 4. ユーザーがいいねした投稿一覧
```
GET /api/likes/user/:userId?limit=20&offset=0
```

### 5. いいね確認
```
GET /api/likes/check/:userId/:postId
```

---

## フォローAPI

### 1. フォロー
```
POST /api/follows
```
**Body**:
```json
{
  "follower_id": "follower-user-uuid",
  "following_id": "following-user-uuid"
}
```

### 2. フォロー解除
```
DELETE /api/follows/:followerId/:followingId
```

### 3. フォロワー一覧
```
GET /api/follows/followers/:userId?limit=20&offset=0
```

### 4. フォロー中ユーザー一覧
```
GET /api/follows/following/:userId?limit=20&offset=0
```

### 5. 相互フォロー一覧
```
GET /api/follows/mutual/:userId?limit=20&offset=0
```

### 6. おすすめユーザー
```
GET /api/follows/suggestions/:userId?limit=10
```

### 7. フォロー確認
```
GET /api/follows/check/:followerId/:followingId
```

---

## リポストAPI

### 1. リポスト
```
POST /api/reposts
```
**Body**:
```json
{
  "user_id": "user-uuid-here",
  "post_id": "post-uuid-here"
}
```

### 2. リポスト解除
```
DELETE /api/reposts/:userId/:postId
```

### 3. 投稿をリポストしたユーザー一覧
```
GET /api/reposts/post/:postId?limit=20&offset=0
```

### 4. ユーザーがリポストした投稿一覧
```
GET /api/reposts/user/:userId?limit=20&offset=0
```

### 5. リポスト確認
```
GET /api/reposts/check/:userId/:postId
```

### 6. リポストをピン留め
```
POST /api/reposts/:postId/pin
```
**Body**:
```json
{
  "user_id": "user-uuid-here"
}
```

### 7. リポストのピン留め解除
```
DELETE /api/reposts/:userId/:postId/pin
```

### 8. ユーザーのピン留めリポスト取得
```
GET /api/users/:userId/pinned-repost?current_user_id=current-user-uuid
```

---

## テストシナリオ例

### 1. ユーザー作成とプロフィール設定
```bash
# 1. ユーザー作成
POST /api/users
{
  "firebase_uid": "test_001",
  "email": "alice@example.com",
  "username": "alice",
  "display_name": "Alice"
}

# 2. レスポンスからuser_idをコピー

# 3. プロフィール更新
PUT /api/profiles/{user_id}
{
  "bio": "Software Engineer",
  "location": "Tokyo",
  "website": "https://alice.dev"
}
```

### 2. 投稿とい いね
```bash
# 1. 投稿作成
POST /api/posts
{
  "user_id": "{user_id}",
  "content": "My first tweet!"
}

# 2. レスポンスからpost_idをコピー

# 3. いいね
POST /api/likes
{
  "user_id": "{another_user_id}",
  "post_id": "{post_id}"
}
```

### 3. フォローとタイムライン
```bash
# 1. フォロー
POST /api/follows
{
  "follower_id": "{user_a_id}",
  "following_id": "{user_b_id}"
}

# 2. タイムライン取得
GET /api/posts/timeline/{user_a_id}?limit=20
```

---

## エラーレスポンス

### 400 - Bad Request
```json
{
  "status": "error",
  "message": "Invalid email format"
}
```

### 404 - Not Found
```json
{
  "status": "error",
  "message": "User not found"
}
```

### 409 - Conflict
```json
{
  "status": "error",
  "message": "Email already in use"
}
```

### 500 - Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```
