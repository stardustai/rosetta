import 'fake-indexeddb/auto';
import './offlineFixture';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDB } from 'idb';
import type { PublicAnnotationInput } from '../src/annotation/schema';
import {
  activateAnnotationPreview,
  checkpointAnnotationPreview,
  deleteAnnotationPreview,
  loadAnnotationPreview,
  prepareAnnotationPreview,
} from '../src/localData/annotationPreview';
import { database } from '../src/localData/database';
import { QuickSession } from '../src/localData/quickSession';
import {
  releaseStagedImports,
  stageLocalFiles,
  stagedFile,
} from '../src/localData/stagedImports';
import { deleteSession, getLocalFile } from '../src/localData/storage';
import type { StorageConnection } from '../src/objectStorage/types';

test('launch snapshots transfer multiple local records and binary files across store disposal without creating tasks', async () => {
  const parent = {};
  const child = {};
  const data = stageLocalFiles(
    parent,
    ['first.png', 'second.png'].map((path) => ({
      path,
      file: new File([path], path, { type: 'image/png' }),
    })),
    false,
  );
  const input: PublicAnnotationInput = {
    taskParams: { type: 'multiple', records: data.records, operators: [] },
  };
  const quick = new QuickSession();
  quick.setDetails([
    { name: '第一张', description: '批量导入' },
    { name: '第二张' },
  ]);
  const db = await database();
  const count = await db.count('sessions');
  const source: StorageConnection = {
    provider: 'oss',
    bucket: 'fixture',
    region: 'cn-hangzhou',
    endpoint: '',
    prefix: '',
    accessKeyId: 'test-ak',
    accessKeySecret: 'test-secret',
    securityToken: 'test-token',
  };
  const value = await prepareAnnotationPreview(input, 1, quick.snapshot(), [
    source,
  ]);
  releaseStagedImports(parent);
  assert.equal(stagedFile(String(data.records[0].attachment)), undefined);
  const loaded = await loadAnnotationPreview(value.id);
  const release = activateAnnotationPreview(loaded, child);
  try {
    assert.equal(loaded.index, 1);
    assert.deepEqual(loaded.input, input);
    assert.equal(loaded.quickSession.details[1].name, '第二张');
    assert.equal(
      await (await getLocalFile(String(data.records[0].attachment))).text(),
      'first.png',
    );
    assert.equal(
      await (await getLocalFile(String(data.records[1].attachment))).text(),
      'second.png',
    );
    assert.ok(!JSON.stringify(loaded).includes('test-secret'));
    assert.ok(!JSON.stringify(loaded.cloudSources).includes('accessKeyId'));
    assert.equal(await db.count('sessions'), count);
    assert.equal(await db.get('imports', data.imports[0].id), undefined);
    assert.deepEqual(
      (await loadAnnotationPreview(value.id)).input,
      input,
      'The same launch can be reloaded without consuming its input',
    );
  } finally {
    release();
    await deleteAnnotationPreview(value.id);
  }
});

test('authorized preview saves keep task IDs and results after reloading the launch', async () => {
  const input = {
    taskParams: {
      type: 'multiple',
      records: [
        { attachmentType: 'IMAGE', attachment: '/examples/street.svg' },
      ],
      operators: [],
    },
  } as PublicAnnotationInput;
  const quick = new QuickSession();
  const preview = await prepareAnnotationPreview(
    input,
    0,
    quick.snapshot(),
    [],
  );
  const saved = await quick.saveAll(input);
  const next = await checkpointAnnotationPreview(
    preview,
    input,
    0,
    quick.snapshot(),
  );
  const restored = new QuickSession();
  await restored.restore((await loadAnnotationPreview(next.id)).quickSession);
  try {
    const again = await restored.saveAll(input);
    assert.equal(again[0].id, saved[0].id);
    await deleteSession(saved[0].id);
    await assert.rejects(
      new QuickSession().restore(next.quickSession),
      /does not exist/i,
    );
  } finally {
    await deleteAnnotationPreview(next.id);
  }
});

test('expired launches are removed and a failed launch commit does not leave a partial snapshot', async () => {
  const input = {
    taskParams: {
      type: 'multiple',
      records: [{ attachmentType: 'IMAGE', attachment: '/image.png' }],
      operators: [],
    },
  } as PublicAnnotationInput;
  const quick = new QuickSession();
  const value = await prepareAnnotationPreview(input, 0, quick.snapshot(), []);
  const db = await openDB('annotation-tool-previews', 1);
  try {
    await db.put('previews', { ...value, expiresAt: Date.now() - 1 });
    await assert.rejects(loadAnnotationPreview(value.id), /expired/i);
    assert.equal(await db.get('previews', value.id), undefined);
    await assert.rejects(
      prepareAnnotationPreview(input, 2, quick.snapshot(), []),
      /Select/i,
    );
    const put = IDBObjectStore.prototype.put;
    const before = await db.count('previews');
    try {
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === 'previews')
          throw new DOMException('quota', 'QuotaExceededError');
        return put.call(this, value, key);
      };
      await assert.rejects(
        prepareAnnotationPreview(input, 0, quick.snapshot(), []),
        /quota/,
      );
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    assert.equal(await db.count('previews'), before);
  } finally {
    db.close();
  }
});

test('exporting the current preview creates only its single-data task', async () => {
  const input = {
    taskParams: {
      type: 'multiple',
      records: ['first.png', 'second.png'].map((name) => ({
        attachmentType: 'IMAGE',
        attachment: `/${name}`,
      })),
      operators: [],
      taskResults: [
        { annotations: [], issues: [], notes: [] },
        { annotations: [], issues: [], notes: [] },
      ],
    },
  } as PublicAnnotationInput;
  const db = await database();
  const count = await db.count('sessions');
  const quick = new QuickSession();
  const current = await quick.saveCurrent(input, 1);
  try {
    assert.equal(await db.count('sessions'), count + 1);
    assert.equal(current.input.taskParams.type, 'multiple');
    assert.deepEqual(current.submittedIndices, []);
    assert.equal(quick.snapshot().sessions.length, 1);
    assert.equal((await quick.saveCurrent(input, 1)).id, current.id);
  } finally {
    await deleteSession(current.id);
  }
});
