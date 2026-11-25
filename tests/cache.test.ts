import 'fake-indexeddb/auto';
import { encode } from '@msgpack/msgpack';
import type {
  DataRecordType,
  PublicAnnotationInput,
} from '../src/annotation/schema';
import { get, set } from 'idb-keyval';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CacheController } from '../src/cache/controller';
import {
  clearCachedInputs,
  deleteCachedInput,
  listCachedInputs,
  loadCachedInput,
  saveCachedInput,
} from '../src/cache/storage';

const input = (text: string): PublicAnnotationInput => ({
  taskParams: {
    type: 'multiple',
    operators: [],
    records: [
      { attachmentType: 'TEXT' as DataRecordType.Text, attachment: text },
    ],
  },
});

test('cache migration and concurrent mutations keep metadata and data together without reviving old entries', async () => {
  const dom = new JSDOM('', { url: 'https://cache.example' });
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: dom.window.localStorage,
  });
  try {
    localStorage.setItem(
      'public-annotation-cache-index',
      JSON.stringify([{ id: 'legacy', name: 'old', timestamp: 1, size: 8 }]),
    );
    await set('public-annotation-data-legacy', encode(input('old')));
    await set('unrelated-operators', { keep: true });
    assert.equal((await listCachedInputs())[0].id, 'legacy');
    assert.deepEqual(await loadCachedInput('legacy'), input('old'));
    await Promise.all([
      saveCachedInput({ id: 'one', name: 'One' }, input('one')),
      saveCachedInput({ id: 'two', name: 'Two' }, input('two')),
    ]);
    assert.equal((await listCachedInputs()).length, 3);

    const put = IDBObjectStore.prototype.put;
    try {
      IDBObjectStore.prototype.put = function (value, key) {
        if (key === 'public-annotation-cache-index')
          throw new Error('index write failed');
        return put.call(this, value, key);
      };
      await assert.rejects(
        saveCachedInput(
          { id: 'legacy', name: 'overwrite' },
          input('overwrite'),
        ),
        /index write failed/,
      );
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    assert.deepEqual(await loadCachedInput('legacy'), input('old'));
    assert.equal(
      (await listCachedInputs()).find((entry) => entry.id === 'legacy')?.name,
      'old',
    );
    await deleteCachedInput('one');
    assert.equal(await loadCachedInput('one'), null);
    await clearCachedInputs();
    assert.deepEqual(await listCachedInputs(), []);
    assert.equal(await loadCachedInput('legacy'), null);
    assert.deepEqual(await get('unrelated-operators'), { keep: true });
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
    dom.window.close();
  }
});

test('cancel aborts a pending download and failed refreshes preserve an existing cache', async () => {
  const originalFetch = globalThis.fetch;
  const dom = new JSDOM('', { url: 'https://cache.example' });
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: dom.window.localStorage,
  });
  let fetching!: () => void;
  const started = new Promise<void>((done) => {
    fetching = done;
  });
  let aborted = false;
  const controller = new CacheController(
    async (url) => url,
    () => {},
  );
  try {
    await saveCachedInput({ id: 'refresh', name: 'saved' }, input('saved'));
    globalThis.fetch = async (request) => {
      const signal = (request as Request).signal;
      const body = new ReadableStream<Uint8Array>({
        start(stream) {
          signal.addEventListener('abort', () => {
            aborted = true;
            stream.error(new DOMException('cancelled', 'AbortError'));
          });
        },
      });
      fetching();
      return new Response(body, {
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const running = controller.cache(
      'https://cache.example/data',
      'refresh',
      'refresh',
    );
    await started;
    controller.cancel('refresh');
    assert.equal(await running, null);
    assert.equal(aborted, true);
    assert.deepEqual(await loadCachedInput('refresh'), input('saved'));
    globalThis.fetch = async () => Response.json(input('new'));
    assert.equal(
      await controller.cache(
        'https://cache.example/data',
        'refresh',
        'refresh',
      ),
      'refresh',
    );
    assert.deepEqual(await loadCachedInput('refresh'), input('new'));
    globalThis.fetch = async () => {
      throw new Error('offline');
    };
    assert.equal(
      await controller.cache(
        'https://cache.example/data',
        'refresh',
        'refresh',
      ),
      null,
    );
    assert.deepEqual(await loadCachedInput('refresh'), input('new'));
  } finally {
    controller.cancelAll();
    globalThis.fetch = originalFetch;
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
    dom.window.close();
  }
});
