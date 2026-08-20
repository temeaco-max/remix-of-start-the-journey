import { AppState, Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import { streamChatMessage } from "@/lib/chat-client";
import { flushOfflineQueue, type PendingOfflineAction } from "@/lib/offline-queue";
import { haptic } from "@/lib/haptics";

let started = false;
let stopTimer: ReturnType<typeof setInterval> | undefined;
let appStateSubscription: { remove: () => void } | undefined;
let processing = false;

async function hasConnectivity(): Promise<boolean> {
  try {
    await fetch(getApiBaseUrl(), { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(4000) });
    return true;
  } catch {
    return false;
  }
}

async function processAction(action: PendingOfflineAction): Promise<void> {
  if (action.kind === "chat") {
    const result = await streamChatMessage({ message: action.message, conversationId: action.conversationId, contextAction: action.contextAction, onEvent: () => undefined, queueOnFailure: false });
    if (!result.reply.trim()) throw new Error("Queued chat message did not receive a response.");
    return;
  }

  // Task state is already persisted locally and owner-scoped. Reaching this processor
  // means connectivity has returned, so the queued local mutation can be retired without
  // pretending a non-existent task endpoint performed a second write.
}

export async function flushMobileOfflineQueue(): Promise<number> {
  if (processing || !(await hasConnectivity())) return 0;
  processing = true;
  try {
    const processed = await flushOfflineQueue(processAction);
    if (processed > 0) haptic.success();
    return processed;
  } finally {
    processing = false;
  }
}

export function startMobileOfflineSync(): () => void {
  if (started) return () => undefined;
  started = true;
  void flushMobileOfflineQueue();
  const trigger = () => { void flushMobileOfflineQueue(); };
  stopTimer = setInterval(trigger, 20_000);
  if (Platform.OS !== "web") appStateSubscription = AppState.addEventListener("change", (state) => { if (state === "active") trigger(); });
  else if (typeof window !== "undefined") window.addEventListener("online", trigger);
  return () => {
    started = false;
    if (stopTimer) clearInterval(stopTimer);
    stopTimer = undefined;
    appStateSubscription?.remove();
    appStateSubscription = undefined;
    if (Platform.OS === "web" && typeof window !== "undefined") window.removeEventListener("online", trigger);
  };
}
