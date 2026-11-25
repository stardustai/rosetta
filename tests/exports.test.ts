import type {
  DataRecordType,
  PublicAnnotationInput,
} from '../src/annotation/schema';
import 'fake-indexeddb/auto';
import './offlineFixture';
import { openDB } from 'idb';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deliverExport } from '../src/exports/deliver';
import {
  apiExportURL,
  exportPrefix,
  getExportSettings,
  normalizeApiTarget,
  normalizeExportSettings,
  saveExportSettings,
} from '../src/exports/settings';
import { database } from '../src/localData/database';
import { prepareSessionExport } from '../src/localData/export';
import { normalizeSession, sessionSummary } from '../src/localData/sessionInfo';
import {
  getLocalFile,
  loadSession,
  saveSessionResult,
} from '../src/localData/storage';
import {
  obsAdapter,
  ossAdapter,
  tosAdapter,
} from '../src/objectStorage/adapters';
import { cloudURL, normalizeConnection } from '../src/objectStorage/paths';
import {
  deleteSavedConnection,
  listSavedConnections,
  saveConnection,
} from '../src/objectStorage/savedConnections';
import type { StorageClient } from '../src/objectStorage/types';

const taskInput: PublicAnnotationInput = {
  taskParams: {
    type: 'multiple',
    operators: [],
    records: [
      {
        attachmentType: 'IMAGE' as DataRecordType.Image,
        attachment: 'local://old-import/1.png',
      },
    ],
    taskResults: [{ annotations: [], notes: [], issues: [] }],
  },
};
const api = {
  url: 'https://api.example.test/tasks/{taskId}/annotations',
  method: 'POST' as const,
  headers: [{ name: 'Authorization', value: 'Bearer export-api-secret' }],
};
const connection = normalizeConnection({
  provider: 'oss',
  bucket: 'export-fixture',
  region: 'cn-hangzhou',
  endpoint: '',
  prefix: 'dataset/',
  accessKeyId: 'export-cloud-id',
  accessKeySecret: 'export-cloud-secret',
});

test('configured export delivery', async (t) => {
  await t.test(
    'version-3 storage upgrades with tasks, results, connections and original files intact',
    async () => {
      const old = await openDB('annotation-tool-local', 3, {
        upgrade(db) {
          db.createObjectStore('files', { keyPath: 'url' }).createIndex(
            'importId',
            'importId',
          );
          db.createObjectStore('imports', { keyPath: 'id' });
          db.createObjectStore('sessions', { keyPath: 'id' });
          db.createObjectStore('taskSummaries', { keyPath: 'id' });
          db.createObjectStore('connections', { keyPath: 'id' });
        },
      });
      const session = normalizeSession({
        id: 'existing-task',
        name: '原有/任务',
        input: taskInput,
        submittedIndices: [0],
        createdAt: 100,
        updatedAt: 200,
        lastSavedAt: 200,
      });
      await old.put('sessions', session);
      await old.put('taskSummaries', sessionSummary(session));
      await old.put('files', {
        url: 'local://old-import/1.png',
        importId: 'old-import',
        path: '1.png',
        blob: new Blob(['original']),
      });
      await old.put('imports', {
        id: 'old-import',
        name: 'old',
        status: 'ready',
        count: 1,
        totalSize: 8,
        createdAt: 100,
      });
      await old.put('connections', {
        id: 'oss://export-fixture',
        name: '原有连接',
        connection,
        createdAt: 100,
        updatedAt: 200,
      });
      old.close();
      assert.equal((await getExportSettings()).defaultMethod, 'download');
      assert.equal((await database()).version, 7);
      assert.deepEqual(await loadSession(session.id), session);
      assert.equal(
        await (await getLocalFile('local://old-import/1.png')).text(),
        'original',
      );
      assert.deepEqual(
        (await listSavedConnections())[0].connection,
        connection,
      );
    },
  );

  await t.test(
    'API and storage settings persist separately from task data and survive reopening',
    async () => {
      const saved = await saveExportSettings({
        defaultMethod: 'api',
        api,
        storage: {
          sourceId: 'oss://export-fixture',
          prefix: '/导出//results/',
        },
      });
      assert.equal(saved.storage?.prefix, '导出/results/');
      const reopened = await openDB('annotation-tool-local');
      assert.deepEqual(await reopened.get('exportSettings', 'default'), saved);
      reopened.close();
      assert.ok(!JSON.stringify(saved).includes('export-cloud-secret'));
      assert.deepEqual((await loadSession('existing-task')).input, taskInput);
    },
  );

  await t.test(
    'validation rejects invalid defaults, unsafe API headers, malformed URLs and parent directories',
    async () => {
      for (const url of [
        'javascript:alert(1)',
        '/relative',
        'https://user:password@example.test',
        'https://example.test/{unknown}',
        'https://example.test/{taskId',
      ]) {
        assert.throws(() => normalizeApiTarget({ ...api, url }));
      }
      for (const headers of [
        [{ name: 'Cookie', value: 'x' }],
        [
          { name: 'X-Key', value: 'x' },
          { name: 'x-key', value: 'y' },
        ],
        [{ name: 'Authorization', value: 'Bearer x\r\nInjected: yes' }],
      ]) {
        assert.throws(() => normalizeApiTarget({ ...api, headers }));
      }
      assert.throws(
        () => normalizeExportSettings({ defaultMethod: 'api' }),
        /API/,
      );
      assert.throws(
        () => normalizeExportSettings({ defaultMethod: 'storage' }),
        /data source/i,
      );
      assert.throws(() => exportPrefix('results/../input'), /directory/i);
      assert.throws(() => exportPrefix('results\\input'), /directory/i);
      assert.equal(
        apiExportURL('https://example.test/results?id={taskId}', '任务/一'),
        'https://example.test/results?id=%E4%BB%BB%E5%8A%A1%2F%E4%B8%80',
      );
      const before = await getExportSettings();
      await assert.rejects(
        saveExportSettings({
          defaultMethod: 'storage',
          storage: { sourceId: 'missing-source', prefix: '' },
        }),
        /deleted/i,
      );
      assert.deepEqual(await getExportSettings(), before);
    },
  );

  await t.test(
    'export snapshots contain the current protocol and stay stable during later annotation saves',
    async () => {
      const snapshot = await prepareSessionExport('existing-task');
      assert.equal(snapshot.filename, '原有_任务.json');
      assert.equal(snapshot.blob.type, 'application/json');
      assert.deepEqual(JSON.parse(await snapshot.blob.text()), taskInput);
      assert.ok(!(await snapshot.blob.text()).includes('export-api-secret'));
      assert.ok(!(await snapshot.blob.text()).includes('export-cloud-secret'));
      await saveSessionResult(
        'existing-task',
        { annotations: [], notes: ['later-result'], issues: [] } as any,
        0,
      );
      assert.deepEqual(JSON.parse(await snapshot.blob.text()), taskInput);
      assert.notEqual(
        (await prepareSessionExport('existing-task')).objectFilename,
        snapshot.objectFilename,
      );
    },
  );

  await t.test(
    'API delivery posts the exact JSON snapshot, configured auth and task URL and accepts 2xx without a response body',
    async () => {
      const snapshot = await prepareSessionExport('existing-task');
      const settings = await getExportSettings();
      let calls = 0;
      const receipt = await deliverExport(snapshot, 'api', settings, {
        request: (async (url, init) => {
          calls++;
          assert.equal(
            url,
            'https://api.example.test/tasks/existing-task/annotations',
          );
          assert.equal(init?.method, 'POST');
          const headers = new Headers(init?.headers);
          assert.equal(
            headers.get('authorization'),
            'Bearer export-api-secret',
          );
          assert.equal(headers.get('content-type'), 'application/json');
          assert.equal(
            await (init?.body as Blob).text(),
            await snapshot.blob.text(),
          );
          assert.ok(
            !(await (init?.body as Blob).text()).includes(
              'export-cloud-secret',
            ),
          );
          return new Response(null, { status: 204 });
        }) as typeof fetch,
      });
      assert.equal(calls, 1);
      assert.equal(receipt.status, 204);
      await deliverExport(
        snapshot,
        'api',
        {
          ...settings,
          api: {
            ...api,
            method: 'PUT',
            headers: [
              {
                name: 'content-type',
                value: 'application/json; charset=utf-8',
              },
            ],
          },
        },
        {
          request: (async (_url, init) => {
            assert.equal(init?.method, 'PUT');
            assert.equal(
              new Headers(init?.headers).get('content-type'),
              'application/json; charset=utf-8',
            );
            return new Response(null, { status: 201 });
          }) as typeof fetch,
        },
      );
    },
  );

  await t.test(
    'API failures remain failures and do not change saved annotation results',
    async () => {
      const snapshot = await prepareSessionExport('existing-task');
      const settings = await getExportSettings();
      await assert.rejects(
        deliverExport(snapshot, 'api', settings, {
          request: (async () =>
            new Response(null, { status: 401 })) as typeof fetch,
        }),
        /HTTP 401/,
      );
      await assert.rejects(
        deliverExport(snapshot, 'api', settings, {
          request: (async () => {
            throw new TypeError('Failed to fetch');
          }) as typeof fetch,
        }),
        /CORS/i,
      );
      assert.equal(
        (await loadSession('existing-task')).input.taskParams.type !==
          'include' &&
          (await loadSession('existing-task')).input.taskParams[
            'taskResults'
          ][0].notes[0],
        'later-result',
      );
    },
  );

  await t.test(
    'SDK uploads preserve binary JSON bodies, raw object keys, JSON content type and overwrite protection',
    async () => {
      const body = new Blob(['{"结果":"中文"}'], { type: 'application/json' });
      const key = 'exports/任务 #1.json';
      const oss = ossAdapter({
        async put(name: string, blob: Blob, options: any) {
          assert.equal(name, key);
          assert.equal(blob, body);
          assert.equal(options.mime, 'application/json');
          assert.equal(options.headers['x-oss-forbid-overwrite'], 'true');
        },
      });
      const obs = obsAdapter(
        {
          putObject(options: any, callback: Function) {
            assert.equal(options.Bucket, 'obs-bucket');
            assert.equal(options.Key, key);
            assert.equal(options.SourceFile, body);
            assert.equal(options.ContentType, 'application/json');
            assert.equal(options.ForbidOverwrite, true);
            callback(null, { CommonMsg: { Status: 200 } });
          },
        },
        'obs-bucket',
      );
      const tos = tosAdapter(
        {
          async putObject(options: any) {
            assert.equal(options.bucket, 'tos-bucket');
            assert.equal(options.key, key);
            assert.equal(options.body, body);
            assert.equal(options.contentType, 'application/json');
            assert.equal(options.forbidOverwrite, true);
          },
        },
        'tos-bucket',
      );
      for (const client of [oss, obs, tos]) await client.put!(key, body);
      const denied = obsAdapter(
        {
          putObject(_options: any, callback: Function) {
            callback(null, {
              CommonMsg: { Status: 403, Code: 'AccessDenied' },
            });
          },
        },
        'obs-bucket',
      );
      await assert.rejects(denied.put!(key, body), { status: 403 });
    },
  );

  await t.test(
    'storage delivery reuses saved credentials, performs no source listing and reports encoded object locations',
    async () => {
      const snapshot = await prepareSessionExport('existing-task');
      const filesBefore = (await (await database()).getAll('files')).length;
      for (const provider of ['oss', 'obs', 'tos'] as const) {
        const saved = await saveConnection(
          { ...connection, provider, bucket: `export-${provider}` },
          `导出 ${provider}`,
        );
        const settings = await saveExportSettings({
          defaultMethod: 'storage',
          api,
          storage: { sourceId: saved.id, prefix: '导出/results/' },
        });
        let writes = 0;
        const receipt = await deliverExport(snapshot, 'storage', settings, {
          createClient: async (value) => {
            assert.deepEqual(value, saved.connection);
            return {
              list: async () => {
                throw new Error('Write-only export must not list directories');
              },
              signedURL: async () => {
                throw new Error('No read signing');
              },
              put: async (key, body) => {
                writes++;
                assert.equal(key, `导出/results/${snapshot.objectFilename}`);
                assert.equal(body, snapshot.blob);
              },
            } as StorageClient;
          },
        });
        assert.equal(writes, 1);
        assert.equal(
          receipt.location,
          cloudURL(
            provider,
            saved.connection.bucket,
            `导出/results/${snapshot.objectFilename}`,
          ),
        );
        assert.ok(!JSON.stringify(receipt).includes('export-cloud-secret'));
      }
      assert.equal(
        (await (await database()).getAll('files')).length,
        filesBefore,
      );
    },
  );

  await t.test(
    'updated credentials are used on export, removed sources fail before any request, and permission errors are specific',
    async () => {
      const snapshot = await prepareSessionExport('existing-task');
      const settings = await getExportSettings();
      const saved = (await listSavedConnections()).find(
        (source) => source.id === settings.storage?.sourceId,
      )!;
      const rotated = await saveConnection({
        ...saved.connection,
        accessKeySecret: 'rotated-secret',
      });
      await deliverExport(snapshot, 'storage', settings, {
        createClient: async (value) => {
          assert.equal(value.accessKeySecret, 'rotated-secret');
          return {
            list: async () => {
              throw new Error('Unexpected list');
            },
            signedURL: () => {
              throw new Error('Unexpected read');
            },
            put: async () => {},
          };
        },
      });
      for (const [code, expected] of [
        ['AccessDenied', /PutObject/],
        ['ExpiredToken', /expired/i],
        ['SignatureDoesNotMatch', /Signature/i],
      ] as const) {
        await assert.rejects(
          deliverExport(snapshot, 'storage', settings, {
            createClient: async () => ({
              list: async () => {
                throw new Error('Unexpected list');
              },
              signedURL: () => {
                throw new Error('Unexpected read');
              },
              put: async () => {
                throw Object.assign(new Error('denied'), {
                  status: 403,
                  code,
                });
              },
            }),
          }),
          expected,
        );
      }
      await assert.rejects(
        deliverExport(snapshot, 'storage', settings, {
          createClient: async () => ({
            list: async () => {
              throw new Error('Unexpected list');
            },
            signedURL: () => {
              throw new Error('Unexpected read');
            },
            put: async () => {
              throw Object.assign(new Error('exists'), { status: 409 });
            },
          }),
        }),
        /already exists/i,
      );
      await deleteSavedConnection(rotated.connection);
      let called = false;
      await assert.rejects(
        deliverExport(snapshot, 'storage', settings, {
          createClient: async () => {
            called = true;
            throw new Error('must not call');
          },
        }),
        /deleted/i,
      );
      assert.equal(called, false);
    },
  );
});
