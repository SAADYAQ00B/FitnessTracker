import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

// Channel 1: WhatsApp-style heads-up banner notification (Default)
export const WHATSAPP_CHANNEL_ID = "fitness-whatsapp-notify";
export const WHATSAPP_CHANNEL_NAME = "FITNESSTRACKER Notifications";

// Channel 2: High-priority Alarm Alert (Optional Alarm Mode)
export const ALARM_CHANNEL_ID = "fitness-alarm-alert";
export const ALARM_CHANNEL_NAME = "FITNESSTRACKER Alarm Alerts";

// Backward compatibility alias
export const NOTIFICATION_CHANNEL_ID = WHATSAPP_CHANNEL_ID;
export const NOTIFICATION_CHANNEL_NAME = WHATSAPP_CHANNEL_NAME;

export const WEEKLY_REPORT_NOTIFICATION_ID = 999999;

export interface NotificationPrefs {
  workoutReminders: boolean;
  goalAchievements: boolean;
  weeklyReport: boolean;
  communityUpdates: boolean;
}

const PREFS_KEY = "ft_notification_prefs";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  workoutReminders: true,
  goalAchievements: true,
  weeklyReport: false,
  communityUpdates: true,
};

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        workoutReminders: parsed.workoutReminders ?? true,
        goalAchievements: parsed.goalAchievements ?? true,
        weeklyReport: parsed.weeklyReport ?? false,
        communityUpdates: parsed.communityUpdates ?? true,
      };
    }
  } catch (err) {
    console.warn("Failed to parse notification prefs", err);
  }
  return { ...DEFAULT_NOTIFICATION_PREFS };
}

export function setNotificationPrefs(prefs: Partial<NotificationPrefs>): NotificationPrefs {
  const current = getNotificationPrefs();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save notification prefs to localStorage", err);
  }
  return updated;
}

/**
 * Converts a MongoDB hex _id or generic string into a deterministic 32-bit positive integer (1 to 2,147,483,640).
 */
export function toNotificationId(id: string): number {
  if (!id) return 1;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return (Math.abs(hash) % 2147483640) + 1;
}

/**
 * Parses times formatted like "7:00 AM", "07:30", "19:45", "9:00 pm", "Weekdays · 7:00 AM", etc.
 */
export function parseScheduleTime(schedule: string): { hour: number; minute: number } {
  if (!schedule) return { hour: 8, minute: 0 };

  const match = schedule.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toLowerCase() : null;

    if (ampm === "pm" && hour < 12) {
      hour += 12;
    } else if (ampm === "am" && hour === 12) {
      hour = 0;
    }
    return {
      hour: Math.min(Math.max(hour, 0), 23),
      minute: Math.min(Math.max(minute, 0), 59),
    };
  }

  const simpleMatch = schedule.match(/(\d{1,2})\s*(am|pm)/i);
  if (simpleMatch) {
    let hour = parseInt(simpleMatch[1], 10);
    const ampm = simpleMatch[2].toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    else if (ampm === "am" && hour === 12) hour = 0;
    return {
      hour: Math.min(Math.max(hour, 0), 23),
      minute: 0,
    };
  }

  return { hour: 8, minute: 0 };
}

let channelsInitialized = false;

/**
 * Requests permissions and initializes both notification channels:
 * Channel 1: WhatsApp-style heads-up banner notification (Default)
 * Channel 2: High-priority Alarm Alert (Optional Alarm Mode)
 */
export async function ensurePermissionsAndChannel(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== "granted") {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== "granted") {
        console.warn("Notification permission not granted");
        return false;
      }
    }

    if (!channelsInitialized) {
      // Channel 1 (fitness-whatsapp-notify — Default): Standard WhatsApp-style heads-up banner
      await LocalNotifications.createChannel({
        id: WHATSAPP_CHANNEL_ID,
        name: WHATSAPP_CHANNEL_NAME,
        description: "Standard WhatsApp-style reminder and milestone banners",
        importance: 4,
        visibility: 1,
        sound: "default",
        vibration: true,
        lights: true,
      });

      // Channel 2 (fitness-alarm-alert — Optional Alarm Mode): High-priority alarm channel
      await LocalNotifications.createChannel({
        id: ALARM_CHANNEL_ID,
        name: ALARM_CHANNEL_NAME,
        description: "High priority alarm alerts for scheduled training habits",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
        lights: true,
      });

      channelsInitialized = true;
    }
    return true;
  } catch (err) {
    console.error("Error setting up notification channels/permissions:", err);
    return false;
  }
}

export interface ReminderNotificationInput {
  id?: string;
  _id?: string;
  title: string;
  schedule: string;
  active?: boolean;
  isAlarm?: boolean;
}

/**
 * Schedules a daily recurring native Android notification for a reminder.
 * Avoids past-time misfires by ensuring nextTrigger is in the future (+24h if already passed today).
 */
export async function scheduleReminderNotification(reminder: ReminderNotificationInput): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const prefs = getNotificationPrefs();
  if (!prefs.workoutReminders || reminder.active === false) {
    return;
  }

  const ok = await ensurePermissionsAndChannel();
  if (!ok) return;

  const rawId = reminder.id || reminder._id;
  if (!rawId) return;

  const notifId = toNotificationId(rawId);
  const { hour, minute } = parseScheduleTime(reminder.schedule);

  const now = new Date();
  const nextTrigger = new Date();
  nextTrigger.setHours(hour, minute, 0, 0);

  // Fix past-time misfires: if nextTrigger <= new Date(), add 24 hours (+1 day)
  // so past times schedule for tomorrow and NEVER fire immediately when opening the app.
  if (nextTrigger.getTime() <= now.getTime()) {
    nextTrigger.setDate(nextTrigger.getDate() + 1);
  }

  // Use high-priority alarm channel only if isAlarm is true; otherwise use WhatsApp-style default
  const channelId = reminder.isAlarm ? ALARM_CHANNEL_ID : WHATSAPP_CHANNEL_ID;
  const titlePrefix = reminder.isAlarm ? "🚨 FITNESSTRACKER ALARM" : "⏰ FITNESSTRACKER Reminder";

  try {
    // Cancel any previous notification with this ID first
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: titlePrefix,
          body: `Time for ${reminder.title}! Stay consistent 💪`,
          channelId,
          schedule: {
            at: nextTrigger,
            repeats: true,
            every: "day",
            allowWhileIdle: true,
          },
          extra: {
            reminderId: rawId,
            type: "reminder",
            isAlarm: Boolean(reminder.isAlarm),
          },
        },
      ],
    });
  } catch (err) {
    console.error(`Failed to schedule notification for reminder ${rawId}:`, err);
  }
}

/**
 * Cancels a single scheduled reminder notification.
 */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !reminderId) return;

  const notifId = toNotificationId(reminderId);
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
  } catch (err) {
    console.error(`Failed to cancel notification for reminder ${reminderId}:`, err);
  }
}

/**
 * Cancels all scheduled reminder notifications.
 */
export async function cancelAllReminderNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter((n) => n.id !== WEEKLY_REPORT_NOTIFICATION_ID)
      .map((n) => ({ id: n.id }));

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  } catch (err) {
    console.error("Failed to cancel all reminder notifications:", err);
  }
}

/**
 * Synchronizes all active reminders with native Android notifications.
 */
export async function syncAllReminders(reminders: ReminderNotificationInput[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const prefs = getNotificationPrefs();
  if (!prefs.workoutReminders) {
    await cancelAllReminderNotifications();
    return;
  }

  for (const reminder of reminders) {
    const rawId = reminder.id || reminder._id;
    if (!rawId) continue;

    if (reminder.active !== false) {
      await scheduleReminderNotification(reminder);
    } else {
      await cancelReminderNotification(rawId);
    }
  }
}

/**
 * Triggers an immediate celebratory push notification when hitting a PR or milestone.
 */
export async function triggerMilestoneNotification(customText?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const prefs = getNotificationPrefs();
  if (!prefs.goalAchievements) return;

  const ok = await ensurePermissionsAndChannel();
  if (!ok) return;

  try {
    const notifId = Math.floor(Date.now() % 2000000000) + 1;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: "🏆 Milestone Achieved!",
          body: customText || "You hit a new personal best on FITNESSTRACKER!",
          channelId: WHATSAPP_CHANNEL_ID,
          schedule: {
            at: new Date(Date.now() + 500),
            allowWhileIdle: true,
          },
          extra: {
            type: "milestone",
          },
        },
      ],
    });
  } catch (err) {
    console.error("Failed to trigger milestone notification:", err);
  }
}

/**
 * Schedules a weekly recurring Sunday 10:00 AM summary notification.
 */
export async function scheduleWeeklyReportNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const ok = await ensurePermissionsAndChannel();
  if (!ok) return;

  const now = new Date();
  const target = new Date();
  target.setHours(10, 0, 0, 0);

  // Sunday is 0 in JS getDay()
  const currentDay = target.getDay();
  let daysUntilSunday = (7 - currentDay) % 7;
  if (daysUntilSunday === 0 && target <= now) {
    daysUntilSunday = 7;
  }
  target.setDate(target.getDate() + daysUntilSunday);

  try {
    await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REPORT_NOTIFICATION_ID }] });

    await LocalNotifications.schedule({
      notifications: [
        {
          id: WEEKLY_REPORT_NOTIFICATION_ID,
          title: "📊 Weekly Progress Report",
          body: "Your FITNESSTRACKER Weekly Progress Report is ready!",
          channelId: WHATSAPP_CHANNEL_ID,
          schedule: {
            at: target,
            repeats: true,
            every: "week",
            allowWhileIdle: true,
          },
          extra: {
            type: "weekly_report",
          },
        },
      ],
    });
  } catch (err) {
    console.error("Failed to schedule weekly report notification:", err);
  }
}

/**
 * Cancels the weekly recurring report notification.
 */
export async function cancelWeeklyReportNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REPORT_NOTIFICATION_ID }] });
  } catch (err) {
    console.error("Failed to cancel weekly report notification:", err);
  }
}
