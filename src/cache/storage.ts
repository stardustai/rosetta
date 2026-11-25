import { t } from '../i18n';
import { decode, encode } from '@msgpack/msgpack';
import type { PublicAnnotationInput } from '../annotation/schema';
import { wrap } from 'idb';
import type { DBSchema, IDBPObjectStore } from 'idb';
import { createStore, get } from 'idb-keyval';
import { notifyLocalChange } from '../localData/events';
import { commitTransaction } from '../storage/transaction';
import type { CacheItem } from './types';

const DATA_PREFIX = 'public-annotation-data-';
const INDEX_KEY = 'public-annotation-cache-index';
interface CacheDatabase extends DBSchema {
  keyval: { key: IDBValidKey; value: unknown };
}
type CacheStore = IDBPObjectStore<
  CacheDatabase,
  ['keyval'],
  'keyval',
  'readwrite'
>;
const useStore = createStore('keyval-store', 'keyval');

function readMetadata(value: unknown): CacheItem[] {
  if (!Array.isArray(value))
    throw new Error(t('The local cache index is invalid'));
  return value.map((item: unknown) => {
    if (
      !item ||
      typeof item !== 'object' ||
      !('id' in item) ||
      typeof item.id !== 'string' ||
      !('name' in item) ||
      typeof item.name !== 'string'
    )
      throw new Error(t('The local cache index is invalid'));
    const entry = item as CacheItem;
    return {
      id: entry.id,
      name: entry.name,
      url: entry.url,
      timestamp: entry.timestamp || 0,
      size: entry.size || 0,
      status: 'idle' as const,
      progress: entry.size ? 100 : 0,
    };
  });
}

// Reuse the original idb-keyval database and payload keys. Move only the index
// from localStorage, so metadata and binary data can commit in one transaction.
async function changeIndex<T>(
  operation: (store: CacheStore, index: CacheItem[]) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const value = await useStore('readwrite', async (native) => {
    const store = wrap(native) as unknown as CacheStore;
    const tx = store.transaction;
    const abort = () => {
      try {
        tx.abort();
      } catch {
        /* settled */
      }
    };
    signal?.addEventListener('abort', abort, { once: true });
    try {
      return await commitTransaction(tx, async () => {
        signal?.throwIfAborted();
        const stored: unknown = await store.get(INDEX_KEY);
        const legacy =
          stored === undefined ? localStorage.getItem(INDEX_KEY) : undefined;
        const index = readMetadata(
          stored ?? (legacy ? JSON.parse(legacy) : []),
        );
        const result = await operation(store, index);
        await store.put(index, INDEX_KEY);
        return result;
      });
    } finally {
      signal?.removeEventListener('abort', abort);
    }
  });
  return value;
}

export const listCachedInputs = () =>
  changeIndex(async (_store, index) => index);

export async function loadCachedInput(
  id: string,
): Promise<PublicAnnotationInput | null> {
  const bytes = await get<Uint8Array>(`${DATA_PREFIX}${id}`, useStore);
  return bytes ? (decode(bytes) as PublicAnnotationInput) : null;
}

export async function saveCachedInput(
  metadata: Pick<CacheItem, 'id' | 'name' | 'url'>,
  input: PublicAnnotationInput,
  signal?: AbortSignal,
) {
  const bytes = encode(input);
  const item: CacheItem = {
    ...metadata,
    timestamp: Date.now(),
    size: bytes.byteLength,
    status: 'idle',
    progress: 100,
  };
  await changeIndex(async (store, index) => {
    await store.put(bytes, `${DATA_PREFIX}${item.id}`);
    const previous = index.findIndex((entry) => entry.id === item.id);
    if (previous >= 0) index.splice(previous, 1);
    index.unshift(item);
  }, signal);
  notifyLocalChange('cache');
  return item;
}

export async function deleteCachedInput(id: string) {
  await changeIndex(async (store, index) => {
    await store.delete(`${DATA_PREFIX}${id}`);
    const at = index.findIndex((item) => item.id === id);
    if (at >= 0) index.splice(at, 1);
  });
  notifyLocalChange('cache');
}

export async function clearCachedInputs() {
  await changeIndex(async (store, index) => {
    // Include old orphaned cache payloads, but retain unrelated idb-keyval data.
    let cursor = await store.openCursor(
      IDBKeyRange.bound(DATA_PREFIX, `${DATA_PREFIX}\uffff`),
    );
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    index.length = 0;
  });
  notifyLocalChange('cache');
}
