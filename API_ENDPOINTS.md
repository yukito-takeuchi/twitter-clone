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
**Body（画像付き投稿）**:
```json
{
  "user_id": "user-uuid-here",
  "content": "Hello, Twitter!",
  "image_url": "https://example.com/image.jpg"
}
```

**Body（動画付き投稿）**:
```json
{
  "user_id": "user-uuid-here",
  "content": "Check out this video!",
  "video_url": "/uploads/video.mp4",
  "video_thumbnail_url": "/uploads/video_thumb.jpg",
  "video_duration": 45
}
```

**注意**: 画像と動画は同時に投稿できません（排他制御）

**引用RT（Quote Retweet）の場合**:
```json
{
  "user_id": "user-uuid-here",
  "content": "Great post!",
  "quoted_post_id": "post-uuid-here",
  "image_url": "optional-image-url"
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

## 画像API

### 1. 画像アップロード（単一）
```
POST /api/images/upload
```
**Form Data**:
- `image`: 画像ファイル (max 5MB)
- `user_id`: ユーザーID

**レスポンス**:
```json
{
  "image": {
    "id": "image-uuid",
    "user_id": "user-uuid",
    "url": "/uploads/filename.jpg",
    "file_name": "filename.jpg",
    "file_size": 123456,
    "mime_type": "image/jpeg",
    "storage_type": "local",
    "created_at": "2025-11-01T00:00:00.000Z"
  },
  "url": "/uploads/filename.jpg"
}
```

### 2. 画像アップロード（複数）
```
POST /api/images/upload-multiple
```
**Form Data**:
- `images`: 画像ファイル配列 (max 4枚、各5MB)
- `user_id`: ユーザーID

**レスポンス**:
```json
{
  "images": [...],
  "urls": ["/uploads/file1.jpg", "/uploads/file2.jpg"]
}
```

---

## 動画API

### 1. 動画アップロード
```
POST /api/videos/upload
```
**Form Data**:
- `video`: 動画ファイル (max 200MB、最大2分)
- `user_id`: ユーザーID

**レスポンス**:
```json
{
  "video": {
    "id": "video-uuid",
    "user_id": "user-uuid",
    "url": "/uploads/filename.mp4",
    "thumbnail_url": "/uploads/filename_thumb.jpg",
    "file_name": "original.mp4",
    "file_size": 12345678,
    "mime_type": "video/mp4",
    "duration": 45,
    "width": 1920,
    "height": 1080,
    "storage_type": "local",
    "created_at": "2025-11-01T00:00:00.000Z"
  },
  "url": "/uploads/filename.mp4",
  "thumbnail_url": "/uploads/filename_thumb.jpg",
  "duration": 45.5,
  "width": 1920,
  "height": 1080
}
```

**対応フォーマット**: mp4, mov, avi, webm, mkv, flv, wmv

**制限**:
- 最大ファイルサイズ: 200MB
- 最大再生時間: 2分（120秒）

### 2. 動画取得（ID）
```
GET /api/videos/:id
```

### 3. ユーザーの動画一覧
```
GET /api/videos/user/:userId?limit=20&offset=0
```

### 4. 動画削除
```
DELETE /api/videos/:id
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

### 4. 動画アップロードと投稿
```bash
# 1. 動画アップロード
POST /api/videos/upload
Form Data:
  - video: video_file.mp4
  - user_id: {user_id}

# レスポンス例:
{
  "video": {...},
  "url": "/uploads/abc123.mp4",
  "thumbnail_url": "/uploads/abc123_thumb.jpg",
  "duration": 45.5
}

# 2. 動画付き投稿作成
POST /api/posts
{
  "user_id": "{user_id}",
  "content": "Check out my video!",
  "video_url": "/uploads/abc123.mp4",
  "video_thumbnail_url": "/uploads/abc123_thumb.jpg",
  "video_duration": 45
}
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

**動画アップロード時のエラー例**:
```json
{
  "error": "Video duration exceeds maximum allowed (2 minutes). Your video is 145 seconds."
}
```

```json
{
  "error": "Cannot include both image and video in a single post"
}
```

```json
{
  "error": "Only video files are allowed (mp4, mov, avi, webm, mkv, flv, wmv)"
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
