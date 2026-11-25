import { t } from '../../../i18n';
import { fetchResourceURL } from '../../../annotation/configuration';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CacheController } from '../../../cache/controller';
import {
  clearCachedInputs,
  deleteCachedInput,
  listCachedInputs,
  loadCachedInput,
} from '../../../cache/storage';
import type { BatchProgress, CacheItem } from '../../../cache/types';
import { formatSize } from '../../../localData/files';
import { notifyLocalChange } from '../../../localData/events';
import { useLocalQuery } from '../../../localData/useLocalQuery';
export type { BatchProgress, CacheItem } from '../../../cache/types';

export function useCacheManager() {
  const { data: saved = [], error } = useLocalQuery(
    'cache',
    listCachedInputs,
    t('Cannot read local cache'),
  );
  const [runtime, setRuntime] = useState<Record<string, CacheItem>>({});
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const batch = useRef<AbortController>();
  const active = useRef(true);
  const [controller] = useState(
    () =>
      new CacheController(fetchResourceURL, (item) => {
        if (active.current)
          setRuntime((items) => ({ ...items, [item.id]: item }));
      }),
  );
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      batch.current?.abort();
      controller.cancelAll();
    };
  }, [controller]);
  useEffect(() => {
    const committed = Object.values(runtime).filter(
      (item) =>
        item.status === 'success' &&
        saved.some(
          (stored) =>
            stored.id === item.id && stored.timestamp >= item.timestamp,
        ),
    );
    if (committed.length)
      setRuntime((current) => {
        const next = { ...current };
        committed.forEach((item) => {
          if (next[item.id] === item) delete next[item.id];
        });
        return next;
      });
  }, [saved, runtime]);
  const cacheItems = useMemo(() => {
    const merged = new Map(saved.map((item) => [item.id, item]));
    Object.values(runtime).forEach((item) => merged.set(item.id, item));
    return [...merged.values()].sort((a, b) => b.timestamp - a.timestamp);
  }, [saved, runtime]);

  function removeRuntime(id: string) {
    setRuntime((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }
  const cancelCaching = (id: string) => {
    controller.cancel(id);
    setRuntime((current) =>
      current[id]
        ? { ...current, [id]: { ...current[id], status: 'cancelled' } }
        : current,
    );
  };
  const cancelAllCaching = () => {
    batch.current?.abort();
    controller.cancelAll();
    setRuntime((items) =>
      Object.fromEntries(
        Object.entries(items).map(([id, item]) => [
          id,
          item.status === 'caching'
            ? { ...item, status: 'cancelled' as const }
            : item,
        ]),
      ),
    );
  };

  async function batchCacheFromURLs(
    items: Array<{ url: string; name: string }>,
  ) {
    if (batch.current) {
      message.warning(t('A cache operation is in progress. Please wait'));
      return;
    }
    const abort = new AbortController();
    batch.current = abort;
    setIsLoading(true);
    const progress = { total: items.length, completed: 0, failed: 0 };
    setBatchProgress({ ...progress });
    try {
      for (const item of items) {
        if (abort.signal.aborted) break;
        const result = await controller.cache(item.url, item.name);
        if (result) progress.completed++;
        else progress.failed++;
        if (active.current) setBatchProgress({ ...progress });
      }
      if (!abort.signal.aborted && active.current)
        message.success(
          t(
            'Batch caching complete. Succeeded: {{completed}}, failed: {{failed}}',
            progress,
          ),
        );
    } finally {
      if (batch.current === abort) batch.current = undefined;
      if (active.current) setIsLoading(false);
    }
  }
  async function refreshSingleCache(id: string) {
    const item = cacheItems.find((item) => item.id === id);
    if (!item?.url || item.status === 'caching') return;
    if (await controller.cache(item.url, item.name, id))
      message.success(`${t('Cache refreshed')}: ${item.name}`);
  }
  async function deleteCachedData(id: string) {
    try {
      controller.cancel(id);
      await deleteCachedInput(id);
      removeRuntime(id);
      message.success(t('Cache deleted'));
      return true;
    } catch (failure) {
      message.error(
        failure instanceof Error
          ? failure.message
          : t('Failed to delete cache'),
      );
      return false;
    }
  }
  async function clearAllCache() {
    try {
      cancelAllCaching();
      await clearCachedInputs();
      setRuntime({});
      message.success(t('All caches cleared'));
      return true;
    } catch (failure) {
      message.error(
        failure instanceof Error ? failure.message : t('Failed to clear cache'),
      );
      return false;
    }
  }
  const initializeCacheItems = useCallback(
    () => notifyLocalChange('cache'),
    [],
  );
  return {
    cacheItems,
    isLoading,
    batchProgress,
    error,
    initializeCacheItems,
    getCacheIndex: listCachedInputs,
    batchCacheFromURLs,
    refreshSingleCache,
    loadCachedData: loadCachedInput,
    deleteCachedData,
    clearAllCache,
    cancelCaching,
    cancelAllCaching,
    getCacheStats: async () => ({
      count: cacheItems.length,
      totalSize: cacheItems.reduce((sum, item) => sum + item.size, 0),
    }),
    formatCacheSize: formatSize,
  };
}
