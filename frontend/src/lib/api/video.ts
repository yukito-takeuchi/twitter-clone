import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface Video {
  id: string;
  user_id: string;
  post_id: string | null;
  url: string;
  thumbnail_url: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  storage_type: "local" | "gcs";
  created_at: Date;
}

export interface UploadVideoResponse {
  video: Video;
  url: string;
  thumbnail_url?: string;
  duration: number;
  width: number;
  height: number;
}

export const videoApi = {
  // Upload a video file
  uploadVideo: async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadVideoResponse> => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("user_id", userId);

    const response = await axios.post(`${API_URL}/videos/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<Video> => {
    const response = await axios.get(`${API_URL}/videos/${videoId}`);
    return response.data;
  },

  // Get videos by user ID
  getVideosByUserId: async (
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Video[]> => {
    const response = await axios.get(`${API_URL}/videos/user/${userId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<void> => {
    await axios.delete(`${API_URL}/videos/${videoId}`);
  },
};
