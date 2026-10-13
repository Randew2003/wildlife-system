import { useCallback, useEffect, useRef, useState } from 'react';

import { flushOfflineQueue, getOfflineQueue } from '@/services/offline';
import type { OfflineQueueItem } from '@/types/domain';

export type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

export function useResource<T>(loader: () => Promise<T>, dependencies: unknown[]): ResourceState<T> {
  const dependencyKey = dependencies.map((value) => String(value ?? '')).join('|');
  const loaderRef = useRef(loader);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await loaderRef.current());
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);

      try {
        const nextData = await loaderRef.current();

        if (mounted) {
          setData(nextData);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception instanceof Error ? exception.message : 'Unable to load data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [dependencyKey]);

  return { data, loading, error, refresh, setData };
}

export function useOfflineQueueState(token?: string) {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    setQueue(await getOfflineQueue());
  }, []);

  useEffect(() => {
    let mounted = true;

    getOfflineQueue().then((nextQueue) => {
      if (mounted) {
        setQueue(nextQueue);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (!token) {
      return;
    }

    setSyncing(true);

    try {
      const result = await flushOfflineQueue(token);
      setQueue(result.remaining);
      setMessage(`${result.synced.length} synced, ${result.remaining.length} still pending.`);
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Unable to synchronize queue.');
    } finally {
      setSyncing(false);
    }
  }, [token]);

  return {
    queue,
    syncing,
    message,
    refreshQueue,
    syncNow,
    setMessage,
  };
}
