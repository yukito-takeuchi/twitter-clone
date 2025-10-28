import { Router } from "express";
import { notificationController } from "../controllers/notificationController";

const router = Router();

// Get all notifications
router.get("/", notificationController.getNotifications);

// Get unread notifications
router.get("/unread", notificationController.getUnreadNotifications);

// Get unread count
router.get("/count", notificationController.getUnreadCount);

// Get notifications by type
router.get("/type", notificationController.getNotificationsByType);

// Get notification statistics
router.get("/stats", notificationController.getStats);

// Get notification settings
router.get("/settings", notificationController.getSettings);

// Update notification settings
router.put("/settings", notificationController.updateSettings);

// Mark a notification as read
router.put("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.put("/read-all", notificationController.markAllAsRead);

// Delete a notification
router.delete("/:id", notificationController.deleteNotification);

export default router;
