// User types
export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

// Post types
export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  reply_to_id: string | null;
  repost_of_id: string | null;
  is_deleted: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithStats extends Post {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  like_count: number;
  reply_count: number;
  retweet_count: number;
  is_liked_by_current_user?: boolean;
}

// Like types
export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

// Follow types
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UserWithProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_following?: boolean;
}

export interface FollowStats {
  follower_count: number;
  following_count: number;
}

// API Response types
export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

// Auth types
export interface SignupData {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Create/Update types
export interface CreatePostData {
  user_id: string;
  content: string;
  image_url?: string;
  reply_to_id?: string;
}

export interface UpdateProfileData {
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
}
