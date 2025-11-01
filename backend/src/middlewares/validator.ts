import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): boolean => {
  // Username must be 3-50 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === "") {
    throw new AppError(`${fieldName} is required`, 400);
  }
};

// User validation middleware
export const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firebase_uid, email, username } = req.body;

    validateRequired(firebase_uid, "firebase_uid");
    validateRequired(email, "email");
    validateRequired(username, "username");

    if (!validateEmail(email)) {
      throw new AppError("Invalid email format", 400);
    }

    if (!validateUsername(username)) {
      throw new AppError(
        "Username must be 3-50 characters and contain only letters, numbers, and underscores",
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { display_name, is_active } = req.body;

    if (display_name !== undefined && display_name !== null) {
      if (typeof display_name !== "string" || display_name.length > 100) {
        throw new AppError("Display name must be a string with max 100 characters", 400);
      }
    }

    if (is_active !== undefined && typeof is_active !== "boolean") {
      throw new AppError("is_active must be a boolean", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Post validation middleware
export const validateCreatePost = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, content, image_url, video_url } = req.body;

    validateRequired(user_id, "user_id");
    validateRequired(content, "content");

    if (typeof content !== "string") {
      throw new AppError("Content must be a string", 400);
    }

    if (content.length > 280) {
      throw new AppError("Content must be 280 characters or less", 400);
    }

    if (content.trim().length === 0) {
      throw new AppError("Content cannot be empty", 400);
    }

    // Validate that image_url and video_url are not both present
    if (image_url && video_url) {
      throw new AppError("Cannot include both image and video in a single post", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdatePost = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;

    if (content !== undefined) {
      if (typeof content !== "string") {
        throw new AppError("Content must be a string", 400);
      }

      if (content.length > 280) {
        throw new AppError("Content must be 280 characters or less", 400);
      }

      if (content.trim().length === 0) {
        throw new AppError("Content cannot be empty", 400);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Profile validation middleware
export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bio, location, website } = req.body;

    if (bio !== undefined && typeof bio !== "string") {
      throw new AppError("Bio must be a string", 400);
    }

    if (location !== undefined && typeof location !== "string") {
      throw new AppError("Location must be a string", 400);
    }

    if (website !== undefined && typeof website !== "string") {
      throw new AppError("Website must be a string", 400);
    }

    if (website && website.length > 0) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(website)) {
        throw new AppError("Website must be a valid URL", 400);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Pagination validation
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      throw new AppError("Limit must be between 1 and 100", 400);
    }

    if (offset < 0) {
      throw new AppError("Offset must be 0 or greater", 400);
    }

    req.query.limit = limit.toString();
    req.query.offset = offset.toString();

    next();
  } catch (error) {
    next(error);
  }
};
