import { t } from '../../../i18n';
import { fetchResourceURL } from '../../../annotation/configuration';
import { message } from 'antd';
import type { PublicAnnotationInput } from '../../../annotation/schema';
import { useRequest } from 'ahooks';
import { useCallback, useEffect, useRef } from 'react';
import { downloadAnnotationInput } from '../../../cache/download';
import { listCachedInputs, loadCachedInput } from '../../../cache/storage';

interface FetchOptions {
  forceRemote?: boolean;
  useCache?: boolean;
}

export function useEnhancedDataFetcher(
  onLoaded: (input: PublicAnnotationInput) => void,
) {
  const pending = useRef<AbortController>();
  const { loading, run, cancel } = useRequest(
    async (
      input: string | PublicAnnotationInput,
      { forceRemote = false, useCache = true }: FetchOptions = {},
    ) => {
      pending.current?.abort();
      const abort = new AbortController();
      pending.current = abort;
      try {
        if (typeof input !== 'string') return input;
        if (!forceRemote && useCache) {
          try {
            const index = await listCachedInputs();
            abort.signal.throwIfAborted();
            const entry = index.find((item) => item.url === input);
            const cached = entry ? await loadCachedInput(entry.id) : null;
            abort.signal.throwIfAborted();
            if (cached) return cached;
          } catch (error) {
            abort.signal.throwIfAborted();
            console.warn('Failed to read the local cache:', error);
          }
        }
        const url = await fetchResourceURL(input);
        abort.signal.throwIfAborted();
        return await downloadAnnotationInput(url, abort.signal);
      } finally {
        if (pending.current === abort) pending.current = undefined;
      }
    },
    {
      manual: true,
      onSuccess: onLoaded,
      onError: (error) =>
        message.error(`${t('Failed to load data')}: ${error.message}`),
    },
  );
  const cancelDataLoad = useCallback(() => {
    cancel();
    pending.current?.abort();
    pending.current = undefined;
  }, [cancel]);
  useEffect(() => () => pending.current?.abort(), []);

  return { loading, fetchPublicAnnotationInput: run, cancelDataLoad };
}
