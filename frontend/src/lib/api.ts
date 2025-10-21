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

  getByUsername: async (username: string): Promise<{ user: User; profile: Profile }> => {
    const response = await api.get<ApiResponse<{ user: User; profile: Profile }>>(
      `/users/username/${username}`
    );
    return response.data.data!;
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

  getAll: async (limit = 20, offset = 0): Promise<PostWithStats[]> => {
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/posts?limit=${limit}&offset=${offset}`
    );
    return response.data.data!.posts;
  },

  getById: async (id: string): Promise<PostWithStats> => {
    const response = await api.get<ApiResponse<{ post: PostWithStats }>>(`/posts/${id}`);
    return response.data.data!.post;
  },

  getByUser: async (userId: string, limit = 20, offset = 0): Promise<PostWithStats[]> => {
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/posts/user/${userId}?limit=${limit}&offset=${offset}`
    );
    return response.data.data!.posts;
  },

  getTimeline: async (userId: string, limit = 20, offset = 0): Promise<PostWithStats[]> => {
    const response = await api.get<ApiResponse<{ posts: PostWithStats[] }>>(
      `/posts/timeline/${userId}?limit=${limit}&offset=${offset}`
    );
    return response.data.data!.posts;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};

// Like API
export const likeApi = {
  like: async (userId: string, postId: string): Promise<void> => {
    await api.post('/likes', { user_id: userId, post_id: postId });
  },

  unlike: async (userId: string, postId: string): Promise<void> => {
    await api.delete(`/likes/${userId}/${postId}`);
  },

  checkIfLiked: async (userId: string, postId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ has_liked: boolean }>>(
      `/likes/check/${userId}/${postId}`
    );
    return response.data.data!.has_liked;
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
};

export default api;
