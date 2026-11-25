import type { PublicAnnotationInput } from '../src/annotation/schema';
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planLocalTasks } from '../src/localData/batchTasks';
import { database } from '../src/localData/database';
import { inputsFromJSON, tasksFromInput } from '../src/localData/dataTasks';
import { prepareSessionExport } from '../src/localData/export';
import { buildLocalImport, localURL } from '../src/localData/files';
import { sessionRecords } from '../src/localData/sessionInfo';
import {
  createTask,
  createTasks,
  deleteSession,
  getLocalFile,
  listSessions,
  loadSession,
  releaseUnusedImports,
  saveSession,
  saveSessionResult,
  startSession,
  storeImport,
  updateTaskDetails,
} from '../src/localData/storage';
import { inputResults } from '../src/localData/taskInput';
import { buildCloudImport, planCloudTasks } from '../src/objectStorage/import';
import { normalizeConnection, sourceKey } from '../src/objectStorage/paths';
import {
  deleteSavedConnection,
  listSavedConnections,
  saveConnection,
  savedConnectionFor,
} from '../src/objectStorage/savedConnections';
import './offlineFixture';

const input = (
  name = 'one',
  attachment = `https://data.example.test/${name}.png`,
): PublicAnnotationInput => ({
  taskParams: {
    type: 'multiple',
    operators: [],
    records: [{ name, attachmentType: 'IMAGE', attachment } as any],
  },
});
const result = (note: string) =>
  ({ annotations: [], notes: [note], issues: [] } as any);
const file = (path: string) => ({
  path,
  file: new File(['file'], path.split('/').pop()!),
});

test('flat single-record annotation task management', async (t) => {
  await t.test(
    'version-1 containers migrate into flat tasks without losing records, results or files',
    async () => {
      const legacy = await openDB('annotation-tool-local', 1, {
        upgrade(db) {
          db.createObjectStore('sessions', { keyPath: 'id' });
          db.createObjectStore('files', { keyPath: 'url' }).createIndex(
            'importId',
            'importId',
          );
          db.createObjectStore('imports', { keyPath: 'id' });
        },
      });
      const original: PublicAnnotationInput = {
        taskParams: {
          type: 'multiple',
          operators: [],
          records: [
            sessionRecords(input('a'))[0],
            sessionRecords(input('b'))[0],
          ],
          taskResults: [result('legacy-a'), result('legacy-b')],
        },
      };
      await legacy.put('sessions', {
        id: 'legacy',
        input: original,
        index: 1,
        name: '旧批次',
        updatedAt: 1234,
        lastSavedAt: 1000,
      });
      await legacy.put('files', {
        url: 'local://old/file.png',
        path: 'file.png',
        importId: 'old',
        blob: new Blob(['original']),
      });
      legacy.close();
      assert.equal((await database()).version, 7);
      const tasks = await listSessions();
      assert.equal(tasks.length, 2);
      assert.ok(tasks.every((task) => task.count === 1));
      const active = await loadSession('legacy');
      assert.equal(
        (sessionRecords(active.input)[0] as { name?: string }).name,
        'b',
      );
      assert.deepEqual(inputResults(active.input)[0], result('legacy-b'));
      assert.equal(active.index, 0);
      const other = await loadSession(
        tasks.find((task) => task.id !== 'legacy')!.id,
      );
      assert.deepEqual(inputResults(other.input)[0], result('legacy-a'));
      assert.equal(
        await (await getLocalFile('local://old/file.png')).text(),
        'original',
      );
    },
  );
  await t.test('empty or multi-record tasks cannot be created', async () => {
    const before = (await listSessions()).length;
    await assert.rejects(
      () =>
        createTasks([
          {
            name: 'empty',
            input: {
              taskParams: { type: 'multiple', records: [], operators: [] },
            },
          },
        ]),
      /one (?:data )?item/i,
    );
    const many = {
      taskParams: {
        type: 'multiple' as const,
        operators: [],
        records: [...sessionRecords(input('a')), ...sessionRecords(input('b'))],
      },
    };
    await assert.rejects(
      () => createTasks([{ name: 'many', input: many }]),
      /one (?:data )?item/i,
    );
    await assert.rejects(() => saveSession(many), /one (?:data )?item/i);
    assert.equal((await listSessions()).length, before);
  });
  let ids: string[] = [];
  await t.test(
    'batch creation commits independent one-record tasks without a grouping requirement',
    async () => {
      ids = (
        await createTasks([
          { name: 'a', input: input('a') },
          { name: 'b', input: input('b') },
        ])
      ).map((task) => task.id);
      await createTask('c', input('c'));
      assert.equal((await listSessions()).length, 5);
      for (const id of ids)
        assert.equal(sessionRecords((await loadSession(id)).input).length, 1);
      assert.ok((await listSessions()).every((task) => !('projectId' in task)));
      const count = (await listSessions()).length;
      await assert.rejects(
        () =>
          createTasks([
            { name: 'valid', input: input() },
            { name: ' ', input: input() },
          ]),
        /name/i,
      );
      assert.equal((await listSessions()).length, count);
    },
  );
  await t.test(
    'a failed batch write rolls back all created tasks',
    async () => {
      const original = crypto.randomUUID;
      const before = (await listSessions()).length;
      crypto.randomUUID = () => 'forced-duplicate' as any;
      try {
        await assert.rejects(() =>
          createTasks([
            { name: 'one', input: input() },
            { name: 'two', input: input() },
          ]),
        );
      } finally {
        crypto.randomUUID = original;
      }
      assert.equal((await listSessions()).length, before);
    },
  );
  await t.test(
    'saving one task changes only its own results and its own status',
    async () => {
      await startSession(ids[0]);
      assert.equal((await loadSession(ids[0])).status, 'in_progress');
      await saveSessionResult(ids[0], result('saved-a'), 0, 0);
      assert.deepEqual(
        inputResults((await loadSession(ids[0])).input)[0],
        result('saved-a'),
      );
      assert.equal(
        inputResults((await loadSession(ids[1])).input)[0],
        undefined,
      );
      assert.equal((await loadSession(ids[0])).status, 'completed');
      assert.equal((await loadSession(ids[1])).status, 'pending');
      await assert.rejects(
        () => saveSessionResult(ids[0], result('wrong-index'), 1),
        /location/i,
      );
    },
  );
  await t.test(
    'configuration edits preserve concurrent saved results and reject stale revisions',
    async () => {
      const stale = await loadSession(ids[0]);
      await saveSessionResult(ids[0], result('newest-result'), 0);
      const changed = structuredClone(stale.input);
      if (changed.taskParams.type !== 'include')
        changed.taskParams.operators = [{ id: 'new-tool' } as any];
      const saved = await saveSession(changed, stale.id, undefined, undefined, {
        requireExisting: true,
        preserveResults: true,
        expectedRevision: stale.contentRevision,
      });
      assert.deepEqual(inputResults(saved.input)[0], result('newest-result'));
      assert.ok(saved.contentRevision > stale.contentRevision);
      await assert.rejects(
        () =>
          saveSessionResult(
            stale.id,
            result('stale'),
            0,
            stale.contentRevision,
          ),
        /changed/i,
      );
    },
  );
  await t.test(
    'failed multi-store updates and deletes roll back without changing the saved task',
    async () => {
      const before = await loadSession(ids[1]);
      const summary = await (await database()).get('taskSummaries', ids[1]);
      const put = IDBObjectStore.prototype.put;
      const remove = IDBObjectStore.prototype.delete;
      try {
        IDBObjectStore.prototype.put = function (...args) {
          if (this.name === 'taskSummaries')
            throw new Error('Fixture summary write failed');
          return put.apply(this, args);
        };
        await assert.rejects(
          updateTaskDetails(ids[1], {
            name: 'must roll back',
            description: '',
          }),
          /summary write failed/,
        );
        IDBObjectStore.prototype.put = put;
        IDBObjectStore.prototype.delete = function (...args) {
          if (this.name === 'taskSummaries')
            throw new Error('Fixture summary delete failed');
          return remove.apply(this, args);
        };
        await assert.rejects(deleteSession(ids[1]), /summary delete failed/);
      } finally {
        IDBObjectStore.prototype.put = put;
        IDBObjectStore.prototype.delete = remove;
      }
      assert.deepEqual(await loadSession(ids[1]), before);
      assert.deepEqual(
        await (await database()).get('taskSummaries', ids[1]),
        summary,
      );
    },
  );
  await t.test('task metadata edits preserve its ID and data', async () => {
    await updateTaskDetails(ids[1], { name: 'new b', description: '说明' });
    assert.equal((await loadSession(ids[1])).id, ids[1]);
    assert.equal(
      (
        sessionRecords((await loadSession(ids[1])).input)[0] as {
          name?: string;
        }
      ).name,
      'b',
    );
    assert.equal((await loadSession(ids[1])).name, 'new b');
  });
  await t.test(
    'local plans contain one file or one exact-directory sequence per task',
    () => {
      const entries = [
        file('dataset/scene/lidar/frame10.pcd'),
        file('dataset/scene/lidar/frame2.pcd'),
        file('dataset/scene/other/frame1.pcd'),
        file('dataset/camera/1.png'),
        file('dataset/camera/2.png'),
        file('dataset/readme.txt'),
      ];
      const frames = planLocalTasks(entries, 'folder', true, 'dataset');
      assert.equal(frames.tasks.length, 4);
      assert.ok(frames.tasks.every((task) => task.recordCount === 1));
      for (const task of frames.tasks) {
        const imported = buildLocalImport(
          task.files,
          task.kind,
          task.sequence,
          'preview',
        );
        assert.equal(imported.records.length, 1);
      }
      assert.equal(
        planLocalTasks(entries, 'file', true, 'dataset').tasks.length,
        6,
      );
      assert.equal(
        planLocalTasks(entries, 'folder', false, 'dataset').tasks.length,
        6,
      );
      assert.throws(
        () => planLocalTasks([entries[0], entries[0]], 'file', false),
        /Duplicate/i,
      );
      assert.throws(
        () => planLocalTasks(entries, 'file', false, 'other'),
        /parent folder/i,
      );
    },
  );
  await t.test(
    'cloud plans follow the same exact-directory sequence boundary',
    () => {
      const objects = [
        'root/scene/lidar/1.pcd',
        'root/scene/lidar/2.pcd',
        'root/scene/other/1.pcd',
      ].map((key) => ({ key, size: 1 }));
      const source = {
        provider: 'oss' as const,
        bucket: 'cloud-fixture',
        prefix: 'root/',
        region: 'cn-hangzhou',
        endpoint: '',
      };
      const plan = planCloudTasks(
        objects,
        'folder',
        true,
        'root/',
        source.bucket,
      );
      assert.equal(plan.tasks.length, 2);
      for (const task of plan.tasks)
        assert.equal(
          buildCloudImport(task.files, source, task.sequence).records.length,
          1,
        );
    },
  );
  await t.test(
    'JSON and JSONL split records while preserving tools and each result',
    () => {
      const many: PublicAnnotationInput = {
        taskParams: {
          type: 'multiple',
          operators: [{ id: 'tool' } as any],
          records: [
            sessionRecords(input('json-a'))[0],
            sessionRecords(input('json-b'))[0],
          ],
          taskResults: [result('a'), result('b')],
        },
      };
      const tasks = tasksFromInput(
        inputsFromJSON(JSON.stringify(many), 'many.json')[0],
      );
      assert.equal(tasks.length, 2);
      assert.deepEqual(inputResults(tasks[1].input!)[0], result('b'));
      assert.equal(sessionRecords(tasks[0].input!).length, 1);
      const lines = sessionRecords(many)
        .map((record) => JSON.stringify(record))
        .join('\n');
      assert.equal(inputsFromJSON(lines, 'many.jsonl').length, 2);
      const withExtras = tasksFromInput({
        ...many,
        extraDataList: [{ source: 'a' }, { source: 'b' }],
      } as any);
      assert.deepEqual((withExtras[1].input as any).extraDataList, [
        { source: 'b' },
      ]);
      const prelabel = {
        ...sessionRecords(input('prelabel'))[0],
        metadata: {
          preprocessedData: {
            operators: [{ key: 'custom-tool' }],
            annotations: [],
          },
        },
      };
      const prelabelTask = tasksFromInput(
        inputsFromJSON(JSON.stringify(prelabel), 'prelabel.jsonl')[0],
      )[0];
      assert.equal(prelabelTask.submitted, false);
      assert.deepEqual((prelabelTask.input!.taskParams as any).operators, [
        { key: 'custom-tool' },
      ]);
      assert.deepEqual(inputResults(prelabelTask.input!)[0]?.annotations, []);
      assert.throws(() => inputsFromJSON('{broken', 'x.json'), /JSON/);
    },
  );
  await t.test(
    'imported results are preserved as independently completed tasks',
    async () => {
      const value = input('imported');
      if (value.taskParams.type !== 'include')
        value.taskParams.taskResults = [result('imported-result')];
      const task = await createTask('imported', value);
      assert.equal(task.status, 'completed');
      assert.deepEqual(inputResults(task.input)[0], result('imported-result'));
      const prelabel = await createTasks([
        { name: 'prelabel', input: value, submitted: false },
      ]);
      assert.equal(prelabel[0].status, 'pending');
    },
  );
  await t.test(
    'cancelling file staging rolls back only the staged import',
    async () => {
      const data = buildLocalImport(
        [file('cancel/1.png'), file('cancel/2.png')],
        'image',
        true,
        'cancel-staging',
      );
      const controller = new AbortController();
      await assert.rejects(
        () => storeImport(data, controller.signal, () => controller.abort()),
        { name: 'AbortError' },
      );
      assert.equal(await (await database()).get('imports', data.id), undefined);
      assert.equal(
        (await (await database()).getAllFromIndex('files', 'importId', data.id))
          .length,
        0,
      );
    },
  );
  await t.test(
    'deleting tasks cleans only unshared local originals',
    async () => {
      const data = buildLocalImport(
        [file('shared/image.png')],
        'image',
        false,
        'shared-import',
      );
      await storeImport(data, new AbortController().signal, () => {});
      const local = input('shared', localURL(data.id, data.files[0].path));
      const removed = await createTask('shared-a', local);
      const retained = await createTask('shared-b', local);
      await deleteSession(removed.id);
      assert.equal((await loadSession(retained.id)).id, retained.id);
      assert.equal(
        await (
          await getLocalFile(localURL(data.id, data.files[0].path))
        ).text(),
        'file',
      );
      await releaseUnusedImports([data.id]);
      assert.ok(await (await database()).get('imports', data.id));
      await deleteSession(retained.id);
      assert.equal(await (await database()).get('imports', data.id), undefined);
      assert.equal(
        (await (await database()).getAllFromIndex('files', 'importId', data.id))
          .length,
        0,
      );
    },
  );
  await t.test(
    'deleting a task prevents stale tabs from recreating it',
    async () => {
      const task = await createTask('one', input());
      await deleteSession(task.id);
      await assert.rejects(
        () =>
          saveSession(task.input, task.id, undefined, undefined, {
            requireExisting: true,
          }),
        /deleted/i,
      );
      await assert.rejects(
        () => saveSessionResult(task.id, result('late'), 0),
        /deleted/i,
      );
      assert.equal(
        (await listSessions()).some((item) => item.id === task.id),
        false,
      );
    },
  );
  await t.test(
    'saved data sources retain CRUD, credential rotation and export isolation',
    async () => {
      const connection = normalizeConnection({
        provider: 'oss',
        bucket: 'fixture',
        region: 'cn-hangzhou',
        endpoint: '',
        prefix: '',
        accessKeyId: 'fixture-id',
        accessKeySecret: 'fixture-secret',
      });
      const saved = await saveConnection(connection, 'source', {
        requireNew: true,
      });
      await assert.rejects(
        () => saveConnection(connection, 'duplicate', { requireNew: true }),
        /already/i,
      );
      await saveConnection(
        { ...connection, accessKeySecret: 'rotated-secret' },
        'updated',
        { previousId: saved.id },
      );
      assert.equal(
        (await savedConnectionFor(connection))?.accessKeySecret,
        'rotated-secret',
      );
      assert.equal(
        (await listSavedConnections()).find(
          (item) => item.id === sourceKey(connection),
        )?.name,
        'updated',
      );
      const exported = await prepareSessionExport(ids[0]);
      const text = await exported.blob.text();
      assert.ok(
        !text.includes('fixture-secret') && !text.includes('rotated-secret'),
      );
      assert.equal(sessionRecords(JSON.parse(text)).length, 1);
      await deleteSavedConnection(connection);
      assert.equal((await listSavedConnections()).length, 0);
      await deleteSession(ids[1]);
      assert.equal(
        (await listSessions()).some((item) => item.id === ids[1]),
        false,
      );
    },
  );
});

test('editing imported per-record tools preserves newer annotation results from another tab', async () => {
  const initial = input('per-record-tools');
  if (initial.taskParams.type !== 'multiple') throw new Error('fixture');
  initial.taskParams.records[0].metadata = {
    preprocessedData: { operators: [{ key: 'before' } as any] },
  };
  const task = await createTask('per-record tools', initial);
  const changed = structuredClone(initial);
  if (changed.taskParams.type !== 'multiple') throw new Error('fixture');
  changed.taskParams.records[0].metadata!.preprocessedData!.operators = [
    { key: 'after' } as any,
  ];
  await saveSessionResult(
    task.id,
    result('newer labels'),
    0,
    task.contentRevision,
  );
  const saved = await saveSession(changed, task.id, undefined, undefined, {
    preserveResults: true,
    expectedRevision: task.contentRevision,
  });
  assert.deepEqual(inputResults(saved.input)[0]?.notes, ['newer labels']);
  assert.equal(
    sessionRecords(saved.input)[0].metadata!.preprocessedData!.operators![0]
      .key,
    'after',
  );
});
