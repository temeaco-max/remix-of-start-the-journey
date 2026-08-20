import AsyncStorage from "@react-native-async-storage/async-storage";

export type PendingChatMessage = {
  kind: "chat";
  id: string;
  message: string;
  conversationId?: string;
  contextAction?: Record<string, string | undefined>;
  createdAt: string;
};

export type PendingTaskUpdate = {
  kind: "task";
  id: string;
  taskId: string;
  state: "paused" | "resumed" | "completed";
  title?: string;
  createdAt: string;
};

export type PendingOfflineAction = PendingChatMessage | PendingTaskUpdate;

const STORAGE_KEY = "kurukoo.mobile.offline-queue.v1";
const listeners = new Set<(items: PendingOfflineAction[]) => void>();
let cached: PendingOfflineAction[] | null = null;
let flushing = false;

function emit(items: PendingOfflineAction[]) {
  cached = items;
  for (const listener of listeners) listener(items);
}

async function read(): Promise<PendingOfflineAction[]> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function write(items: PendingOfflineAction[]): Promise<void> {
  emit(items);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listPendingOfflineActions(): Promise<PendingOfflineAction[]> {
  return read();
}

export function subscribeOfflineQueue(listener: (items: PendingOfflineAction[]) => void): () => void {
  listeners.add(listener);
  void read().then(listener);
  return () => listeners.delete(listener);
}

export async function enqueueOfflineAction(action: PendingOfflineAction): Promise<void> {
  const items = await read();
  const next = [...items.filter((item) => item.id !== action.id), action];
  await write(next);
}

export async function removeOfflineAction(id: string): Promise<void> {
  const items = await read();
  await write(items.filter((item) => item.id !== id));
}

export type OfflineQueueProcessor = (action: PendingOfflineAction) => Promise<void>;

export async function flushOfflineQueue(processor: OfflineQueueProcessor): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let processed = 0;
  try {
    const items = await read();
    for (const action of items) {
      try {
        await processor(action);
        await removeOfflineAction(action.id);
        processed += 1;
      } catch {
        // Stop on the first failure so ordering is preserved and the action remains durable.
        break;
      }
    }
    return processed;
  } finally {
    flushing = false;
  }
}

export function createOfflineId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
