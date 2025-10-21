import { Request, Response } from "express";
import { ImageModel } from "../models/Image";
import { AppError, asyncHandler } from "../middlewares/errorHandler";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

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

    // Generate image URL
    const imageUrl = `/uploads/${req.file.filename}`;

    // Save image metadata to database
    const image = await ImageModel.create({
      user_id,
      url: imageUrl,
      storage_type: "local",
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

    // Save all images
    const imagePromises = files.map(async (file) => {
      const imageUrl = `/uploads/${file.filename}`;
      return await ImageModel.create({
        user_id,
        url: imageUrl,
        storage_type: "local",
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
