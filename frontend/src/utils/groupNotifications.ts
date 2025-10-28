import { Notification, NotificationType } from "@/types/notification";

export interface GroupedNotification {
  id: string; // ID of the first notification in the group
  notification_type: NotificationType;
  notifications: Notification[]; // Array of notifications in this group
  users: Array<{
    username: string;
    display_name: string;
    avatar_url?: string;
  }>;
  related_post_id?: string;
  post_content?: string;
  is_read: boolean; // True if all notifications in group are read
  created_at: string; // Timestamp of the latest notification
  count: number; // Number of notifications in group
}

export type NotificationOrGroup = Notification | GroupedNotification;

export function isGroupedNotification(
  item: NotificationOrGroup
): item is GroupedNotification {
  return "notifications" in item && Array.isArray(item.notifications);
}

/**
 * Group notifications by type and related post/user within 24 hours
 */
export function groupNotifications(
  notifications: Notification[]
): NotificationOrGroup[] {
  console.log("[groupNotifications] Starting with", notifications.length, "notifications");

  if (notifications.length === 0) return [];

  const result: NotificationOrGroup[] = [];
  const processed = new Set<string>();
  const GROUPING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  for (let i = 0; i < notifications.length; i++) {
    const current = notifications[i];

    if (processed.has(current.id)) continue;

    // Find similar notifications within 24 hours
    const similar: Notification[] = [current];
    const currentTime = new Date(current.created_at).getTime();

    console.log(`[groupNotifications] Processing notification ${i}:`, {
      id: current.id,
      type: current.notification_type,
      related_user_id: current.related_user_id,
      related_post_id: current.related_post_id,
      created_at: current.created_at,
    });

    for (let j = i + 1; j < notifications.length; j++) {
      const candidate = notifications[j];

      if (processed.has(candidate.id)) continue;

      const candidateTime = new Date(candidate.created_at).getTime();
      const timeDiff = Math.abs(currentTime - candidateTime);

      // Check if within 24 hours
      if (timeDiff > GROUPING_WINDOW_MS) {
        console.log(`  [Skip] Time diff too large: ${timeDiff}ms`);
        continue;
      }

      // Check if same type
      if (current.notification_type !== candidate.notification_type) {
        console.log(`  [Skip] Different types: ${current.notification_type} vs ${candidate.notification_type}`);
        continue;
      }

      // Check if can be grouped based on type
      const canGroup = canGroupNotifications(current, candidate);

      console.log(`  [Candidate ${j}] ${canGroup ? "✓ CAN GROUP" : "✗ CANNOT GROUP"}:`, {
        id: candidate.id,
        type: candidate.notification_type,
        related_user_id: candidate.related_user_id,
        related_post_id: candidate.related_post_id,
      });

      if (canGroup) {
        similar.push(candidate);
        processed.add(candidate.id);
      }
    }

    processed.add(current.id);

    // If we have multiple similar notifications, create a group
    if (similar.length > 1) {
      console.log(`[groupNotifications] Creating group with ${similar.length} notifications`);
      const grouped = createGroupedNotification(similar);
      result.push(grouped);
    } else {
      console.log(`[groupNotifications] Adding single notification`);
      // Single notification, add as-is
      result.push(current);
    }
  }

  console.log(`[groupNotifications] Finished. Result: ${result.length} items (${result.filter(r => isGroupedNotification(r)).length} groups, ${result.filter(r => !isGroupedNotification(r)).length} singles)`);
  return result;
}

/**
 * Check if two notifications can be grouped together
 */
function canGroupNotifications(a: Notification, b: Notification): boolean {
  console.log("    [canGroupNotifications] Checking:", {
    a_type: a.notification_type,
    b_type: b.notification_type,
    a_user: a.related_user_id,
    b_user: b.related_user_id,
    a_post: a.related_post_id,
    b_post: b.related_post_id,
  });

  // Must be same type
  if (a.notification_type !== b.notification_type) {
    console.log("    [canGroupNotifications] ✗ Different types");
    return false;
  }

  switch (a.notification_type) {
    case "dm":
      // DM: Group messages from the same user
      const canGroupByUser = a.related_user_id === b.related_user_id && !!a.related_user_id;
      console.log(`    [canGroupNotifications] ${canGroupByUser ? "✓" : "✗"} User-based grouping (DM): ${a.related_user_id} === ${b.related_user_id}`);
      return canGroupByUser;

    case "like":
    case "reply":
    case "quote":
      // Different users (don't group notifications from same user)
      if (a.related_user_id === b.related_user_id) {
        console.log("    [canGroupNotifications] ✗ Same user (shouldn't group same user)");
        return false;
      }
      // Group if same post
      const canGroupByPost = a.related_post_id === b.related_post_id && !!a.related_post_id;
      console.log(`    [canGroupNotifications] ${canGroupByPost ? "✓" : "✗"} Post-based grouping (${a.notification_type}): ${a.related_post_id} === ${b.related_post_id}`);
      return canGroupByPost;

    case "follow":
    case "new_post":
      // Different users (don't group notifications from same user)
      if (a.related_user_id === b.related_user_id) {
        console.log("    [canGroupNotifications] ✗ Same user (shouldn't group same user)");
        return false;
      }
      // Group all follows / new posts within time window
      console.log(`    [canGroupNotifications] ✓ Time-based grouping (${a.notification_type})`);
      return true;

    default:
      console.log("    [canGroupNotifications] ✗ Unknown type");
      return false;
  }
}

/**
 * Create a grouped notification from multiple notifications
 */
function createGroupedNotification(
  notifications: Notification[]
): GroupedNotification {
  // Sort by created_at descending (newest first)
  const sorted = [...notifications].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const first = sorted[0];
  const type = first.notification_type;

  // Extract user information from each notification
  const users = sorted.map((notif) => {
    const content = notif.content as any;
    let username = "";
    let display_name = "";

    switch (type) {
      case "dm":
        username = content.sender_username;
        display_name = content.sender_display_name;
        break;
      case "like":
        username = content.liker_username;
        display_name = content.liker_display_name;
        break;
      case "follow":
        username = content.follower_username;
        display_name = content.follower_display_name;
        break;
      case "reply":
        username = content.replier_username;
        display_name = content.replier_display_name;
        break;
      case "quote":
        username = content.quoter_username;
        display_name = content.quoter_display_name;
        break;
      case "new_post":
        username = content.poster_username;
        display_name = content.poster_display_name;
        break;
    }

    return { username, display_name };
  });

  // Get post content if applicable
  let post_content: string | undefined;
  const firstContent = first.content as any;

  if (type === "dm" && firstContent.message_preview) {
    post_content = firstContent.message_preview;
  } else if (type === "like" && firstContent.post_content) {
    post_content = firstContent.post_content;
  } else if (type === "reply" && firstContent.original_post_content) {
    post_content = firstContent.original_post_content;
  } else if (type === "quote" && firstContent.original_post_content) {
    post_content = firstContent.original_post_content;
  }

  // Check if all notifications are read
  const is_read = sorted.every((n) => n.is_read);

  return {
    id: first.id,
    notification_type: type,
    notifications: sorted,
    users,
    related_post_id: first.related_post_id || undefined,
    post_content,
    is_read,
    created_at: sorted[0].created_at, // Most recent
    count: sorted.length,
  };
}
