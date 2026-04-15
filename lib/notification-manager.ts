import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { Goal, ReminderConfig } from "./types";
import { SoundId } from "./sound-config";

const NOTIFICATION_TASK_NAME = "STUDY_REMINDER_TASK";
const REMINDER_CHANNEL_ID = "study-reminders-default-v2";

export async function initializeNotifications(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";

    if (!granted) {
      console.warn("Notification permission not granted");
      return false;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    await ensureReminderChannel();

    if (Platform.OS !== "web") {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIFICATION_TASK_NAME);
      if (!isRegistered) {
        TaskManager.defineTask(NOTIFICATION_TASK_NAME, async () => {
          console.log("Background reminder task executed");
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to initialize notifications:", error);
    return false;
  }
}

async function ensureReminderChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "\u5b66\u4e60\u63d0\u9192",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.NOTIFICATION,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
}

export async function scheduleGoalReminder(
  goal: Goal,
  time: string,
  soundId: SoundId = "default"
): Promise<string | null> {
  try {
    const [hours, minutes] = time.split(":").map(Number);
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new Error("Invalid time format");
    }

    await ensureReminderChannel();

    const trigger = {
      type: "daily" as const,
      hour: hours,
      minute: minutes,
      ...(Platform.OS === "android" ? { channelId: REMINDER_CHANNEL_ID } : {}),
    } as Notifications.NotificationTriggerInput;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "\u5b66\u4e60\u63d0\u9192",
        body: `\u662f\u65f6\u5019\u5f00\u59cb\u5b66\u4e60\u300c${goal.title}\u300d\u4e86\uff01`,
        data: {
          goalId: goal.id,
          goalTitle: goal.title,
          soundId,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        badge: 1,
      },
      trigger,
    });

    console.log(`Scheduled reminder for goal ${goal.id} at ${time}`);
    return notificationId;
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    return null;
  }
}

export async function cancelGoalReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled reminder ${notificationId}`);
  } catch (error) {
    console.error("Failed to cancel reminder:", error);
  }
}

export async function updateGoalReminder(
  goal: Goal,
  newConfig: ReminderConfig
): Promise<ReminderConfig> {
  try {
    if (goal.reminder?.notificationId) {
      await cancelGoalReminder(goal.reminder.notificationId);
    }

    let notificationId: string | undefined;

    if (newConfig.enabled) {
      const id = await scheduleGoalReminder(
        goal,
        newConfig.time,
        (newConfig.soundId as SoundId) ?? "default"
      );
      if (id) {
        notificationId = id;
      } else {
        throw new Error("Failed to schedule new reminder");
      }
    }

    return {
      enabled: newConfig.enabled,
      time: newConfig.time,
      soundId: newConfig.soundId,
      notificationId,
    };
  } catch (error) {
    console.error("Failed to update reminder:", error);
    throw error;
  }
}

export async function getScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Failed to get scheduled notifications:", error);
    return [];
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    const scheduled = await getScheduledNotifications();
    for (const notification of scheduled) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    console.log("Cleared all notifications");
  } catch (error) {
    console.error("Failed to clear notifications:", error);
  }
}

export function setupNotificationResponseListener(
  onNotificationResponse: (goalId: string) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const goalId = (response.notification.request.content.data as Record<string, any>).goalId;
      if (goalId) {
        onNotificationResponse(goalId);
      }
    }
  );

  return subscription;
}