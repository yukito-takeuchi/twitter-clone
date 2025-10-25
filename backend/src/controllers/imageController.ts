import { Request, Response } from "express";
import { ImageModel } from "../models/Image";
import { AppError, asyncHandler } from "../middlewares/errorHandler";
import { upload, uploadToGCS, isProduction } from "../config/storage";

export const imageController = {
  // Upload single image
  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const { user_id } = req.body;

    if (!user_id) {
      throw new AppError("User ID is required", 400);
    }

    let imageUrl: string;
    let storageType: string;

    // Upload to GCS in production, local storage in development
    if (isProduction) {
      imageUrl = await uploadToGCS(req.file);
      storageType = "gcs";
    } else {
      imageUrl = `/uploads/${req.file.filename}`;
      storageType = "local";
    }

    // Save image metadata to database
    const image = await ImageModel.create({
      user_id,
      url: imageUrl,
      storage_type: storageType,
    });

    res.status(201).json({
      status: "success",
      data: {
        image,
        url: imageUrl,
      },
    });
  }),

  // Upload multiple images
  uploadImages: asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    const { user_id } = req.body;

    if (!user_id) {
      throw new AppError("User ID is required", 400);
    }

    const storageType = isProduction ? "gcs" : "local";

    // Save all images
    const imagePromises = files.map(async (file) => {
      let imageUrl: string;

      if (isProduction) {
        imageUrl = await uploadToGCS(file);
      } else {
        imageUrl = `/uploads/${file.filename}`;
      }

      return await ImageModel.create({
        user_id,
        url: imageUrl,
        storage_type: storageType,
      });
    });

    const images = await Promise.all(imagePromises);
    const urls = images.map((img) => img.url);

    res.status(201).json({
      status: "success",
      data: {
        images,
        urls,
      },
    });
  }),

  // Get image by ID
  getImageById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const image = await ImageModel.findById(id);
    if (!image) {
      throw new AppError("Image not found", 404);
    }

    res.json({
      status: "success",
      data: { image },
    });
  }),

  // Delete image
  deleteImage: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const image = await ImageModel.findById(id);
    if (!image) {
      throw new AppError("Image not found", 404);
    }

    // TODO: Delete physical file from storage
    await ImageModel.delete(id);

    res.json({
      status: "success",
      message: "Image deleted successfully",
    });
  }),
};
