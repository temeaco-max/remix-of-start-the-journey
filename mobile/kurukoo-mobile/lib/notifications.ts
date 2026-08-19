import type * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import { buildTaskNotificationData, parseTaskNotificationData } from "@/lib/notification-contract";

export { buildTaskNotificationData, parseTaskNotificationData } from "@/lib/notification-contract";

export type NotificationReadiness =
  | { status: "web-unavailable"; detail: string }
  | { status: "permission-required"; detail: string }
  | { status: "project-id-required"; detail: string }
  | { status: "physical-device-required"; detail: string }
  | { status: "token-ready"; detail: string; token: string };

export type FcmNativeReadiness =
  | { status: "web-unavailable"; detail: string }
  | { status: "permission-required"; detail: string }
  | { status: "ios-native-provider-required"; detail: string }
  | { status: "token-ready"; detail: string; token: string }
  | { status: "registration-failed"; detail: string }
  | { status: "registered"; detail: string };

const NATIVE_DEVICE_ID_KEY = "kurukoo_fcm_native_device_id";

async function getNotificationsModule(): Promise<typeof import("expo-notifications")> {
  return import("expo-notifications");
}

async function getNativeDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(NATIVE_DEVICE_ID_KEY).catch(() => null);
  if (existing) return existing;
  const generated = `native-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await SecureStore.setItemAsync(NATIVE_DEVICE_ID_KEY, generated).catch(() => undefined);
  return generated;
}

export async function probeExpoPushToken(): Promise<NotificationReadiness> {
  if (Platform.OS === "web") return { status: "web-unavailable", detail: "Remote notification registration is unavailable on web." };
  const Notifications = await getNotificationsModule();
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") return { status: "permission-required", detail: "Notification permission is not granted on this device." };
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { status: "project-id-required", detail: "An EAS project identifier is required before a push token can be prepared." };
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return { status: "token-ready", detail: "A device token is available for backend registration; delivery is not yet claimed.", token };
  } catch {
    return { status: "physical-device-required", detail: "A physical device and development/release build are required to obtain a push token." };
  }
}

/** Register a native FCM token when Expo exposes an FCM provider token. */
export async function registerNativeFcmTokenIfPermitted(): Promise<FcmNativeReadiness> {
  if (Platform.OS === "web") return { status: "web-unavailable", detail: "Use the Web/PWA Firebase Messaging client on web." };
  const Notifications = await getNotificationsModule();
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") return { status: "permission-required", detail: "Notification permission is not granted on this device." };

  try {
    const nativeToken = await Notifications.getDevicePushTokenAsync();
    const tokenType = String((nativeToken as any)?.type || "").toLowerCase();
    const token = String((nativeToken as any)?.data || "").trim();
    if (!token) return { status: "registration-failed", detail: "The native notification provider did not return a device token." };
    if (Platform.OS === "ios" && tokenType !== "fcm") {
      return { status: "ios-native-provider-required", detail: "iOS exposed an APNs token. Firebase-native iOS messaging must be configured before it can be registered with the FCM backend." };
    }
    if (tokenType && tokenType !== "fcm") return { status: "ios-native-provider-required", detail: `Native token provider '${tokenType}' is not an FCM registration token.` };

    const sessionToken = await Auth.getSessionToken();
    if (!sessionToken) return { status: "registration-failed", detail: "No authenticated session token is available for device registration." };
    const response = await fetch(`${getApiBaseUrl()}/api/fcm/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
      credentials: "include",
      body: JSON.stringify({ token, deviceId: await getNativeDeviceId(), credentialType: Platform.OS, label: `Kurukoo ${Platform.OS} Firebase notifications`, platform: Platform.OS }),
    });
    if (!response.ok) return { status: "registration-failed", detail: `Kurukoo device registration failed (${response.status}).` };
    return { status: "registered", detail: `Firebase ${Platform.OS} device token registered with Kurukoo.` };
  } catch (error) {
    return { status: "registration-failed", detail: error instanceof Error ? error.message : "Unable to obtain or register the native FCM token." };
  }
}

export async function configureLocalNotifications() {
  if (Platform.OS === "web") return;
  const Notifications = await getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const Notifications = await getNotificationsModule();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("kurukoo-default", {
      name: "Kurukoo reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 160],
      lightColor: "#B95D3C",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") {
    void registerNativeFcmTokenIfPermitted().catch(() => undefined);
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  if (requested.status === "granted") void registerNativeFcmTokenIfPermitted().catch(() => undefined);
  return requested.status === "granted";
}

export async function scheduleReminderOnDevice(reminder: { title: string; detail: string; date: string; time: string }): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const scheduledAt = new Date(`${reminder.date}T${reminder.time}:00`);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) return null;
  const permitted = await requestLocalNotificationPermission();
  if (!permitted) return null;
  const Notifications = await getNotificationsModule();
  return Notifications.scheduleNotificationAsync({
    content: { title: reminder.title, body: reminder.detail, data: { kind: "reminder", reminderTitle: reminder.title } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: scheduledAt },
  });
}

export async function scheduleTaskContinuation(task: { id: string; title: string }, seconds = 60): Promise<string | null> {
  const permitted = await requestLocalNotificationPermission();
  if (!permitted) return null;
  const Notifications = await getNotificationsModule();
  return Notifications.scheduleNotificationAsync({
    content: { title: "Continue with Kurukoo", body: task.title, data: buildTaskNotificationData(task) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
  });
}
