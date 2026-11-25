import type {
  DataRecordType,
  PublicAnnotationInput,
} from '../src/annotation/schema';
import { build } from 'esbuild';
import * as indexedDB from 'fake-indexeddb';
import type { DOMWindow } from 'jsdom';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import type { DataFetcherHarness } from './fixtures/data-fetcher';
import { createDOMFixture } from './support/dom';

const input = (text: string): PublicAnnotationInput => ({
  taskParams: {
    type: 'multiple',
    operators: [],
    records: [
      { attachmentType: 'TEXT' as DataRecordType.Text, attachment: text },
    ],
  },
});

test('data selection aborts obsolete downloads, reuses local cache and cancels on reset or unmount', async () => {
  const bundle = await build({
    entryPoints: [
      fileURLToPath(new URL('./fixtures/data-fetcher.tsx', import.meta.url)),
    ],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"test"' },
    alias: {
      antd: fileURLToPath(
        new URL('./fixtures/data-fetcher-messages.ts', import.meta.url),
      ),
    },
  });
  const {
    dom,
    window: domWindow,
    until,
  } = createDOMFixture('https://fetch.example');
  const window = domWindow as DOMWindow & {
    dataFetcherTest: DataFetcherHarness;
  };
  const requests: Array<{
    signal: AbortSignal;
    resolve: (value: Response) => void;
  }> = [];
  Object.assign(window, indexedDB, {
    Request,
    Response,
    Headers,
    AbortController,
    AbortSignal,
    TextEncoder,
    TextDecoder,
    ReadableStream,
    fetch: async (request: Request) =>
      new Promise<Response>((resolve) => {
        // Deliberately ignore abort to prove late responses cannot publish data.
        requests.push({ signal: request.signal, resolve });
      }),
  });
  try {
    window.eval(bundle.outputFiles[0].text);
    const query = window.dataFetcherTest;
    await until(() => query.state(), 'Data selector should mount');
    query.state().fetchPublicAnnotationInput('https://fetch.example/old', {
      useCache: false,
    });
    await until(() => {
      assert.equal(query.errors.length, 0, query.errors.join('\n'));
      return requests.length === 1;
    }, 'Remote download should start');
    query.state().fetchPublicAnnotationInput(input('local selection'));
    await until(
      () => query.received.length === 1 && !query.state().loading,
      'New selection should finish',
    );
    assert.equal(requests[0].signal.aborted, true);
    requests[0].resolve(Response.json(input('obsolete')));
    await delay(30);
    assert.equal(query.received.length, 1);
    assert.equal(query.errors.length, 0);

    await query.cache('https://fetch.example/cached', input('cached'));
    query.state().fetchPublicAnnotationInput('https://fetch.example/cached');
    await until(() => query.received.length === 2, 'Stored input should load');
    assert.equal(requests.length, 1);

    query.state().fetchPublicAnnotationInput('https://fetch.example/cached', {
      forceRemote: true,
    });
    await until(
      () => requests.length === 2,
      'Force remote should bypass cache',
    );
    query.state().cancelDataLoad();
    assert.equal(requests[1].signal.aborted, true);
    requests[1].resolve(Response.json(input('cancelled')));
    await until(() => !query.state().loading, 'Cancel should clear loading');
    await delay(30);
    assert.equal(query.received.length, 2);

    query
      .state()
      .fetchPublicAnnotationInput('https://fetch.example/unmounted', {
        useCache: false,
      });
    await until(() => requests.length === 3, 'Last download should start');
    query.unmount();
    assert.equal(requests[2].signal.aborted, true);
    requests[2].resolve(Response.json(input('unmounted')));
    await delay(30);
    assert.equal(query.received.length, 2);
    assert.equal(query.errors.length, 0);
  } finally {
    dom.window.close();
  }
});
