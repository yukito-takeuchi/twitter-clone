import { Request, Response } from "express";
import { ProfileModel } from "../models/Profile";
import { UserModel } from "../models/User";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const profileController = {
  // Get profile by user ID
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Get profile
    const profile = await ProfileModel.findByUserId(userId);
    if (!profile) {
      throw new AppError("Profile not found", 404);
    }

    res.json({
      status: "success",
      data: {
        profile,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          email: user.email,
        },
      },
    });
  }),

  // Update profile
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { bio, location, website, avatar_url, cover_image_url, birth_date } = req.body;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update or create profile (upsert)
    const profile = await ProfileModel.upsert(userId, {
      bio,
      location,
      website,
      avatar_url,
      cover_image_url,
      birth_date: birth_date ? new Date(birth_date) : undefined,
    });

    res.json({
      status: "success",
      data: { profile },
    });
  }),

  // Delete profile
  deleteProfile: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const deleted = await ProfileModel.delete(userId);
    if (!deleted) {
      throw new AppError("Profile not found", 404);
    }

    res.json({
      status: "success",
      message: "Profile deleted successfully",
    });
  }),
};
