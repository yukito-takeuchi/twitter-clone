import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { ProfileModel } from "../models/Profile";
import { PostModel } from "../models/Post";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const userController = {
  // Create a new user
  createUser: asyncHandler(async (req: Request, res: Response) => {
    const { firebase_uid, email, username, display_name } = req.body;

    // Check if user with same email or username already exists
    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      throw new AppError("Email already in use", 409);
    }

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) {
      throw new AppError("Username already taken", 409);
    }

    const existingFirebaseUid = await UserModel.findByFirebaseUid(firebase_uid);
    if (existingFirebaseUid) {
      throw new AppError("User with this Firebase UID already exists", 409);
    }

    // Create user
    const user = await UserModel.create({
      firebase_uid,
      email,
      username,
      display_name,
    });

    // Create empty profile for the user
    await ProfileModel.create({ user_id: user.id });

    res.status(201).json({
      status: "success",
      data: { user },
    });
  }),

  // Get user by ID
  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Get profile
    const profile = await ProfileModel.findByUserId(id);

    res.json({
      status: "success",
      data: {
        user,
        profile,
      },
    });
  }),

  // Get user by Firebase UID
  getUserByFirebaseUid: asyncHandler(async (req: Request, res: Response) => {
    const { firebase_uid } = req.params;

    const user = await UserModel.findByFirebaseUid(firebase_uid);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Get profile
    const profile = await ProfileModel.findByUserId(user.id);

    res.json({
      status: "success",
      data: {
        user,
        profile,
      },
    });
  }),

  // Get user by username
  getUserByUsername: asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Get profile
    const profile = await ProfileModel.findByUserId(user.id);

    // Get post count
    const postCount = await PostModel.countByUser(user.id);

    res.json({
      status: "success",
      data: {
        user,
        profile,
        postCount,
      },
    });
  }),

  // Get all users (with pagination)
  getAllUsers: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await UserModel.findAll(limit, offset);

    res.json({
      status: "success",
      data: {
        users,
        pagination: {
          limit,
          offset,
          count: users.length,
        },
      },
    });
  }),

  // Search users
  searchUsers: asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!q || typeof q !== "string") {
      throw new AppError("Search query 'q' is required", 400);
    }

    const users = await UserModel.search(q, limit);

    res.json({
      status: "success",
      data: {
        users,
        query: q,
        count: users.length,
      },
    });
  }),

  // Update user
  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { display_name, is_active } = req.body;

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    const user = await UserModel.update(id, {
      display_name,
      is_active,
    });

    res.json({
      status: "success",
      data: { user },
    });
  }),

  // Delete user (soft delete)
  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    await UserModel.softDelete(id);

    res.json({
      status: "success",
      message: "User deleted successfully",
    });
  }),

  // Hard delete user (permanent)
  hardDeleteUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    await UserModel.delete(id);

    res.json({
      status: "success",
      message: "User permanently deleted",
    });
  }),
};
