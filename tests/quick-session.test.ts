import 'fake-indexeddb/auto';
import './offlineFixture';
import type {
  PublicAnnotationInput,
  TaskParamVersion,
  TaskResult,
} from '../src/annotation/schema';
import type { RosettaAnnotationDraft } from '../src/annotation/contracts/frame-v1';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { database } from '../src/localData/database';
import { QuickSession } from '../src/localData/quickSession';
import {
  prepareQuickDraft,
  takeQuickDraft,
} from '../src/localData/quickDrafts';
import { inputResults } from '../src/localData/taskInput';
import {
  applyAnnotationDraft,
  releaseStagedImports,
  stageLocalFiles,
  stagedFile,
} from '../src/localData/stagedImports';
import { getLocalFile, loadSession } from '../src/localData/storage';

function selection(owner: object) {
  const data = stageLocalFiles(
    owner,
    ['first.png', 'second.png'].map((path) => ({
      path,
      file: new File([path], path),
    })),
    false,
  );
  const input: PublicAnnotationInput = {
    taskParams: { type: 'multiple', records: data.records, operators: [] },
  };
  return { data, input };
}
const result = {
  annotations: [],
  issues: [],
  notes: ['preview changes'],
} as unknown as TaskResult;

test('selecting local files is immediately readable and creates neither tasks nor persisted files', async () => {
  const owner = {};
  const { data } = selection(owner);
  const db = await database();
  const tasks = await db.count('sessions');
  try {
    assert.equal(data.records.length, 2);
    const url = String(data.records[0].attachment);
    assert.equal(await (await getLocalFile(url)).text(), 'first.png');
    assert.equal(await db.count('sessions'), tasks);
    for (const item of data.imports)
      assert.equal(await db.get('imports', item.id), undefined);
  } finally {
    releaseStagedImports(owner);
  }
});

test('offline quick saves persist files, split records, and reuse IDs after tool edits', async () => {
  const owner = {};
  const { input, data } = selection(owner);
  const session = new QuickSession();
  try {
    session.setDetails([
      { name: '第一张', description: '批次说明' },
      { name: '第二张' },
    ]);
    const saved = await session.saveAll(input);
    assert.equal(saved.length, 2);
    assert.equal(saved[0].name, '第一张');
    assert.equal(saved[0].description, '批次说明');
    assert.ok(
      saved.every(
        (item) =>
          item.input.taskParams.type === 'multiple' &&
          item.input.taskParams.records.length === 1,
      ),
    );
    const changed = structuredClone(input);
    if (changed.taskParams.type !== 'multiple') throw new Error('fixture');
    changed.taskParams.records[0].metadata = {
      title: 'renamed',
      preprocessedData: { operators: [] },
    };
    const updated = await session.saveAll(changed);
    assert.deepEqual(
      updated.map((item) => item.id),
      saved.map((item) => item.id),
    );
    const completed = await session.saveResult(changed, result, 1);
    assert.equal(completed.id, saved[1].id);
    assert.deepEqual(completed.submittedIndices, [0]);
    assert.deepEqual(
      inputResults((await loadSession(saved[1].id)).input)[0],
      result,
    );
    const edited = structuredClone(changed);
    if (edited.taskParams.type !== 'multiple') throw new Error('fixture');
    edited.taskParams.taskResults = [
      undefined,
      { ...result, metadata: { ...result.metadata, imageRotateAngle: 90 } },
    ];
    const drafts = await session.saveAll(edited);
    assert.equal(drafts[1].id, saved[1].id);
    assert.deepEqual(
      inputResults((await loadSession(saved[1].id)).input)[0]?.metadata
        ?.imageRotateAngle,
      90,
    );
    assert.deepEqual(
      drafts[1].submittedIndices,
      [],
      'Saving the workspace preserves an unsubmitted draft without completing it',
    );
    releaseStagedImports(owner);
    assert.equal(
      await (await getLocalFile(String(data.records[0].attachment))).text(),
      'first.png',
    );
  } finally {
    releaseStagedImports(owner);
  }
});

test('failed task commits clean staged files from IndexedDB and remain retryable', async () => {
  const owner = {};
  const { input, data } = selection(owner);
  const put = IDBObjectStore.prototype.put;
  const session = new QuickSession();
  try {
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'taskSummaries')
        throw new DOMException('quota', 'QuotaExceededError');
      return put.call(this, value, key);
    };
    await assert.rejects(session.saveAll(input), /quota/);
    const db = await database();
    for (const item of data.imports)
      assert.equal(await db.get('imports', item.id), undefined);
    IDBObjectStore.prototype.put = put;
    assert.equal((await session.saveAll(input)).length, 2);
  } finally {
    IDBObjectStore.prototype.put = put;
    releaseStagedImports(owner);
  }
});

test('a previously unsaved quick workspace recovers offline with labels and segmentation without authorized-save receipts', async () => {
  const owner = {};
  const { input, data } = selection(owner);
  const db = await database();
  const receipts = await db.count('saveReports');
  const original = globalThis.fetch;
  let requests = 0;
  const draft: RosettaAnnotationDraft = {
    params: {
      version: '1.0.0' as TaskParamVersion,
      record: data.records[0],
      operators: [],
    },
    result,
    index: 0,
    segmentation: new Uint8Array([3, 5, 8]),
  };
  try {
    globalThis.fetch = async () => {
      requests++;
      throw new Error('offline');
    };
    const changed = applyAnnotationDraft(owner, input, {
      ...draft,
      segmentation: undefined,
    });
    const saved = await new QuickSession().recover(changed, draft);
    assert.equal(saved.length, 2);
    assert.equal(requests, 0);
    assert.equal(await db.count('saveReports'), receipts);
    assert.deepEqual(inputResults(saved[0].input)[0], result);
    assert.deepEqual(saved[0].submittedIndices, []);
    const extra = saved[0].input as PublicAnnotationInput & {
      extraDataList: Array<{ segmentationDataUrl: string }>;
    };
    const bytes = await (
      await getLocalFile(extra.extraDataList[0].segmentationDataUrl)
    ).arrayBuffer();
    assert.deepEqual([...new Uint8Array(bytes)], [3, 5, 8]);
  } finally {
    globalThis.fetch = original;
    releaseStagedImports(owner);
  }
});

test('batch preview transfers local files and task details to the quick editor without persisting them', async () => {
  const previous = {};
  const owner = {};
  const { data, input } = selection(previous);
  const tasks = data.records.map((record, index) => ({
    name: `task ${index}`,
    description: 'keep',
    input: {
      ...input,
      taskParams: {
        type: 'multiple' as const,
        operators: [],
        records: [record],
      },
    },
  }));
  const id = prepareQuickDraft(tasks, previous);
  try {
    const draft = takeQuickDraft(id, owner);
    releaseStagedImports(previous);
    assert.equal(draft.details.length, 2);
    assert.equal(draft.details[0].description, 'keep');
    assert.ok(stagedFile(String(data.records[0].attachment)));
    assert.throws(() => takeQuickDraft(id, owner), /temporary preview/i);
  } finally {
    releaseStagedImports(owner);
  }
});
