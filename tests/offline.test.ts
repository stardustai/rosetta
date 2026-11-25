import 'fake-indexeddb/auto';
import './offlineFixture';
import type { DataRecordType } from '../src/annotation/schema';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deliverExport } from '../src/exports/deliver';
import { getExportSettings, saveExportSettings } from '../src/exports/settings';
import { prepareSessionExport } from '../src/localData/export';
import { buildLocalImport } from '../src/localData/files';
import {
  createTask,
  deleteSession,
  getLocalFile,
  listSessions,
  loadSession,
  renameSession,
  saveSessionIndex,
  saveSessionResult,
  startSession,
  storeImport,
  updateTaskDetails,
} from '../src/localData/storage';
import {
  deleteSavedConnection,
  listSavedConnections,
  saveConnection,
} from '../src/objectStorage/savedConnections';

test('local tasks, data sources, settings and saved results remain usable without an account or backend', async () => {
  const input = {
    taskParams: {
      type: 'multiple' as const,
      operators: [],
      records: [
        {
          attachmentType: 'IMAGE' as DataRecordType.Image,
          attachment: 'https://example.test/a.png',
        },
      ],
    },
  };
  const task = await createTask('offline task', input);
  assert.ok((await listSessions()).some((value) => value.id === task.id));
  await renameSession(task.id, 'renamed');
  await updateTaskDetails(task.id, {
    name: 'saved offline',
    description: 'local only',
  });
  await startSession(task.id);
  await saveSessionIndex(task.id, 0);
  const result = { annotations: [], notes: ['saved'], issues: [] } as any;
  await saveSessionResult(task.id, result, 0);
  const saved = await loadSession(task.id);
  assert.equal(saved.name, 'saved offline');
  assert.equal(saved.status, 'completed');
  const payload = await prepareSessionExport(task.id);
  assert.equal(payload.submittedCount, 1);

  await saveExportSettings({
    defaultMethod: 'api',
    api: {
      url: 'https://export.example.test/results',
      method: 'POST',
      headers: [],
    },
  });
  const settings = await getExportSettings();
  let deliveries = 0;
  await deliverExport(payload, 'api', settings, {
    request: async (url, options) => {
      deliveries++;
      assert.equal(String(url), 'https://export.example.test/results');
      assert.equal(
        await (options?.body as Blob).text(),
        await payload.blob.text(),
      );
      return new Response(null, { status: 204 });
    },
  });
  assert.equal(deliveries, 1);

  const connection = {
    provider: 'oss' as const,
    bucket: 'offline-fixture',
    region: 'cn-hangzhou',
    endpoint: '',
    prefix: '',
    accessKeyId: 'fixture',
    accessKeySecret: 'fixture',
  };
  await saveConnection(connection);
  assert.ok(
    (await listSavedConnections()).some(
      (source) => source.connection.bucket === connection.bucket,
    ),
  );
  await deleteSavedConnection(connection);
  assert.ok(
    !(await listSavedConnections()).some(
      (source) => source.connection.bucket === connection.bucket,
    ),
  );

  const local = buildLocalImport(
    [{ path: 'a.png', file: new File(['local data'], 'a.png') }],
    'image',
    false,
    'offline-import',
  );
  await storeImport(local, new AbortController().signal, () => {});
  assert.equal(
    await (await getLocalFile('local://offline-import/a.png')).text(),
    'local data',
  );
  await deleteSession(task.id);
  assert.ok(!(await listSessions()).some((value) => value.id === task.id));
});
