import { apiRequest } from '@/services/api';
import { getStoredJson, setStoredJson } from '@/services/storage';
import type { OfflineQueueItem } from '@/types/domain';

const OFFLINE_QUEUE_KEY = 'wildlife.offlineQueue.v1';

export async function getOfflineQueue() {
  return getStoredJson<OfflineQueueItem[]>(OFFLINE_QUEUE_KEY, []);
}

export async function saveOfflineQueue(queue: OfflineQueueItem[]) {
  await setStoredJson(OFFLINE_QUEUE_KEY, queue);
}

export async function enqueueOffline(item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'attempts'>) {
  const queue = await getOfflineQueue();
  const queuedItem: OfflineQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await saveOfflineQueue([queuedItem, ...queue]);

  return queuedItem;
}

export async function flushOfflineQueue(token: string) {
  const queue = await getOfflineQueue();
  const remaining: OfflineQueueItem[] = [];
  const synced: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      await apiRequest(item.endpoint, {
        method: item.method,
        token,
        body: item.body,
      });
      synced.push(item);
    } catch {
      remaining.push({
        ...item,
        attempts: item.attempts + 1,
      });
    }
  }

  await saveOfflineQueue(remaining);

  return {
    synced,
    remaining,
  };
}

export function getNetworkStatus() {
  const navigatorLike = globalThis as {
    navigator?: {
      onLine?: boolean;
    };
  };

  if (typeof navigatorLike.navigator?.onLine === 'boolean') {
    return navigatorLike.navigator.onLine;
  }

  return true;
}
