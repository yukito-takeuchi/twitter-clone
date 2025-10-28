import { Request, Response } from "express";
import { NotificationModel } from "../models/Notification";
import { NotificationSettingsModel } from "../models/NotificationSettings";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const notificationController = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const notifications = await NotificationModel.findByUserId(userId, limit, offset);

    res.json({
      status: "success",
      data: { notifications },
    });
  }),

  /**
   * Get unread notifications for the current user
   */
  getUnreadNotifications: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const notifications = await NotificationModel.findUnreadByUserId(userId, limit);

    res.json({
      status: "success",
      data: { notifications },
    });
  }),

  /**
   * Get unread notification count
   */
  getUnreadCount: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const count = await NotificationModel.getUnreadCount(userId);

    res.json({
      status: "success",
      data: { count },
    });
  }),

  /**
   * Get notifications by type
   */
  getNotificationsByType: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const notificationType = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!notificationType) {
      throw new AppError("Notification type is required", 400);
    }

    const notifications = await NotificationModel.findByType(
      userId,
      notificationType as any,
      limit,
      offset
    );

    res.json({
      status: "success",
      data: { notifications },
    });
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const success = await NotificationModel.markAsRead(id);

    if (!success) {
      throw new AppError("Notification not found or already read", 404);
    }

    res.json({
      status: "success",
      message: "Notification marked as read",
    });
  }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.body;

    if (!user_id) {
      throw new AppError("User ID is required", 400);
    }

    const count = await NotificationModel.markAllAsRead(user_id);

    res.json({
      status: "success",
      data: { count },
      message: `${count} notifications marked as read`,
    });
  }),

  /**
   * Get notification statistics
   */
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const stats = await NotificationModel.getUserNotificationStats(userId);

    res.json({
      status: "success",
      data: { stats },
    });
  }),

  /**
   * Get notification settings
   */
  getSettings: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const settings = await NotificationSettingsModel.findByUserId(userId);

    res.json({
      status: "success",
      data: { settings },
    });
  }),

  /**
   * Update notification settings
   */
  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    const { user_id, ...updates } = req.body;

    if (!user_id) {
      throw new AppError("User ID is required", 400);
    }

    const settings = await NotificationSettingsModel.update(user_id, updates);

    res.json({
      status: "success",
      data: { settings },
      message: "Notification settings updated successfully",
    });
  }),

  /**
   * Delete a notification
   */
  deleteNotification: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const success = await NotificationModel.delete(id);

    if (!success) {
      throw new AppError("Notification not found", 404);
    }

    res.json({
      status: "success",
      message: "Notification deleted successfully",
    });
  }),
};
