import axios from 'axios';
import type {
  User,
  Post,
  PostWithStats,
  Profile,
  ApiResponse,
  CreatePostData,
  UpdateProfileData,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  create: async (data: {
    firebase_uid: string;
    email: string;
    username: string;
    display_name: string;
  }): Promise<User> => {
    const response = await api.post<ApiResponse<{ user: User }>>('/users', data);
    return response.data.data!.user;
  },

  getById: async (id: string): Promise<{ user: User; profile: Profile }> => {
    const response = await api.get<ApiResponse<{ user: User; profile: Profile }>>(`/users/${id}`);
    return response.data.data!;
  },

  getByFirebaseUid: async (firebaseUid: string): Promise<{ user: User; profile: Profile }> => {
    const response = await api.get<ApiResponse<{ user: User; profile: Profile }>>(
      `/users/firebase/${firebaseUid}`
    );
    return response.data.data!;
  },

  getByUsername: async (username: string): Promise<{ user: User; profile: Profile }> => {
    const response = await api.get<ApiResponse<{ user: User; profile: Profile }>>(
      `/users/username/${username}`
    );
    return response.data.data!;
  },

  update: async (userId: string, data: { display_name?: string }): Promise<User> => {
    const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}`, data);
    return response.data.data!.user;
  },
};

// Profile API
export const profileApi = {
  get: async (userId: string): Promise<{ profile: Profile; user: User }> => {
    const response = await api.get<ApiResponse<{ profile: Profile; user: User }>>(
      `/profiles/${userId}`
    );
    return response.data.data!;
  },

  update: async (userId: string, data: UpdateProfileData): Promise<Profile> => {
    const response = await api.put<ApiResponse<{ profile: Profile }>>(`/profiles/${userId}`, data);
    return response.data.data!.profile;
  },
};

// Post API
export const postApi = {
  create: async (data: CreatePostData): Promise<Post> => {
    const response = await api.post<ApiResponse<{ post: Post }>>('/posts', data);
    return response.data.data!.post;
  },

  getAll: async (limit = 20, offset = 0, currentUserId?: string): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/posts?${params.toString()}`
    );
    return response.data.data!.posts;
  },

  getById: async (id: string, currentUserId?: string): Promise<PostWithStats> => {
    const params = new URLSearchParams();
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ post: PostWithStats }>>(
      `/posts/${id}${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data!.post;
  },

  getByUser: async (userId: string, limit = 20, offset = 0, currentUserId?: string): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/posts/user/${userId}?${params.toString()}`
    );
    return response.data.data!.posts;
  },

  getTimeline: async (userId: string, limit = 20, offset = 0, currentUserId?: string): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/posts/timeline/${userId}?${params.toString()}`
    );
    return response.data.data!.posts;
  },

  update: async (id: string, data: { content: string }): Promise<Post> => {
    const response = await api.put<ApiResponse<{ post: Post }>>(`/posts/${id}`, data);
    return response.data.data!.post;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  getReplies: async (postId: string, limit = 20, offset = 0, currentUserId?: string): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ replies: PostWithStats[] }>>(
      `/posts/${postId}/replies?${params.toString()}`
    );
    return response.data.data!.replies;
  },

  getRepliesByUser: async (userId: string, limit = 20, offset = 0, currentUserId?: string): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ replies: PostWithStats[] }>>(
      `/posts/user/${userId}/replies?${params.toString()}`
    );
    return response.data.data!.replies;
  },
};

// Like API
export const likeApi = {
  like: async (data: { user_id: string; post_id: string }): Promise<void> => {
    await api.post('/likes', data);
  },

  unlike: async (postId: string, userId: string): Promise<void> => {
    await api.delete(`/likes/${userId}/${postId}`);
  },

  checkIfLiked: async (userId: string, postId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ has_liked: boolean }>>(
      `/likes/check/${userId}/${postId}`
    );
    return response.data.data!.has_liked;
  },
};

// Bookmark API
export const bookmarkApi = {
  bookmark: async (data: { user_id: string; post_id: string }): Promise<void> => {
    await api.post('/bookmarks', data);
  },

  unbookmark: async (postId: string, userId: string): Promise<void> => {
    await api.delete(`/bookmarks/${userId}/${postId}`);
  },

  checkIfBookmarked: async (userId: string, postId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ has_bookmarked: boolean }>>(
      `/bookmarks/check/${userId}/${postId}`
    );
    return response.data.data!.has_bookmarked;
  },

  getBookmarkedPosts: async (userId: string, limit = 20, offset = 0): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await api.get<ApiResponse<{ posts: PostWithStats[]; total_bookmarks: number }>>(
      `/bookmarks/user/${userId}?${params.toString()}`
    );
    return response.data.data!.posts;
  },
};

// Repost API
export const repostApi = {
  repost: async (data: { user_id: string; post_id: string }): Promise<void> => {
    await api.post('/reposts', data);
  },

  unrepost: async (postId: string, userId: string): Promise<void> => {
    await api.delete(`/reposts/${userId}/${postId}`);
  },

  checkIfReposted: async (userId: string, postId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ has_reposted: boolean }>>(
      `/reposts/check/${userId}/${postId}`
    );
    return response.data.data!.has_reposted;
  },

  getRepostedPosts: async (userId: string, limit = 20, offset = 0, currentUserId?: string): Promise<PostWithStats[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/reposts/user/${userId}?${params.toString()}`
    );
    return response.data.data!.posts;
  },
};

// Follow API
export const followApi = {
  follow: async (followerId: string, followingId: string): Promise<void> => {
    await api.post('/follows', { follower_id: followerId, following_id: followingId });
  },

  unfollow: async (followerId: string, followingId: string): Promise<void> => {
    await api.delete(`/follows/${followerId}/${followingId}`);
  },

  checkIfFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ is_following: boolean }>>(
      `/follows/check/${followerId}/${followingId}`
    );
    return response.data.data!.is_following;
  },

  getFollowers: async (userId: string, limit = 20, offset = 0, currentUserId?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ followers: any[]; total_followers: number }>>(
      `/follows/followers/${userId}?${params.toString()}`
    );
    return response.data.data!;
  },

  getFollowing: async (userId: string, limit = 20, offset = 0, currentUserId?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ following: any[]; total_following: number }>>(
      `/follows/following/${userId}?${params.toString()}`
    );
    return response.data.data!;
  },

  getMutualFollows: async (userId: string, limit = 20, offset = 0, currentUserId?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (currentUserId) params.append('currentUserId', currentUserId);
    const response = await api.get<ApiResponse<{ mutual_follows: any[]; total_mutual?: number }>>(
      `/follows/mutual/${userId}?${params.toString()}`
    );
    return response.data.data!;
  },

  getFollowerCount: async (userId: string): Promise<number> => {
    const response = await api.get<ApiResponse<{ followers: any[]; total_followers: number }>>(
      `/follows/followers/${userId}?limit=0`
    );
    return response.data.data!.total_followers;
  },

  getFollowingCount: async (userId: string): Promise<number> => {
    const response = await api.get<ApiResponse<{ following: any[]; total_following: number }>>(
      `/follows/following/${userId}?limit=0`
    );
    return response.data.data!.total_following;
  },
};

// Image API
export const imageApi = {
  uploadImages: async (files: File[], userId: string): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('user_id', userId);

    const response = await api.post<ApiResponse<{ urls: string[] }>>(
      '/images/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!.urls;
  },
};

export default api;
